'use server';

import { load as cheerioLoad } from 'cheerio';
import { URL } from 'url';
import type { ScrapedRecruiter, ScrapeRecruitersInput, ScrapeRecruitersOutput } from '@/ai/schemas/recruiter-schemas';
// global fetch is used

const MAX_PAGES_TO_VISIT = 5; // Limit the number of pages to prevent excessive scraping
const MAX_RESULTS_PER_PAGE = 10; // Limit results from a single page
const REQUEST_TIMEOUT = 10000; // 10 seconds timeout for fetch requests

function extractEmails(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return Array.from(new Set(text.match(emailRegex) || []));
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function normalizeUrl(urlString: string, baseUrl: string): string | null {
  try {
    const url = new URL(urlString, baseUrl);
    // Remove fragment and ensure it's http/https
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    url.hash = ''; 
    return url.href;
  } catch {
    return null;
  }
}


async function fetchPageContent(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CyberConnectAIBot/1.0; +http://example.com/bot)', 
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
      return null;
    }
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('text/html')) {
      console.warn(`Skipping non-HTML content at ${url}`);
      return null;
    }
    return await response.text();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn(`Request to ${url} timed out.`);
    } else {
      console.warn(`Error fetching ${url}:`, error);
    }
    return null;
  }
}

function extractRecruiterInfoFromPage(htmlContent: string, pageUrl: string, companyNameQuery: string): ScrapedRecruiter[] {
  const $ = cheerioLoad(htmlContent);
  const recruiters: ScrapedRecruiter[] = [];
  const potentialRecruiters = new Set<string>(); 

  $('body').find('*').each((_, element) => {
    const $el = $(element);
    const textContent = $el.text().replace(/\s\s+/g, ' ').trim();
    const recruiterKeywords = /\b(recruiter|talent acquisition|sourcer|hiring manager|technical recruiter|hr business partner|people operations|staffing|head of talent)\b/i;
    
    if (recruiterKeywords.test(textContent) && textContent.length < 500) { 
      if (potentialRecruiters.has(textContent.substring(0,100))) return; 
      potentialRecruiters.add(textContent.substring(0,100));

      const emails = extractEmails($el.html() || ''); 
      const linkedInProfiles = new Set<string>();
      $el.find('a[href*="linkedin.com/in/"]').each((_, linkEl) => {
        const href = $(linkEl).attr('href');
        if (href) {
            const normalizedLinkedInUrl = normalizeUrl(href, pageUrl);
            if(normalizedLinkedInUrl) linkedInProfiles.add(normalizedLinkedInUrl);
        }
      });
      
      let recruiterName = "Unknown";
      let title = "Recruiter"; // Default title
      // Try to extract Name and Title from text like "John Doe - Senior Recruiter" or "Jane Doe, Talent Acquisition Lead"
      const nameTitleMatch = textContent.match(/^([a-zA-Z\s.'-]+(?:[a-zA-Z]\.?){0,2})\s*[,-–—]\s*([a-zA-Z\s&()]+)/i);

      if (nameTitleMatch && nameTitleMatch[1] && nameTitleMatch[2]) {
        recruiterName = nameTitleMatch[1].trim();
        title = nameTitleMatch[2].trim();
      } else {
         // Fallback: Try to get a name-like pattern if no clear title delimiter
        const potentialName = textContent.split(/\s+/).slice(0, 3).join(' ');
        if (potentialName.length < 50 && potentialName.length > 3 && /^[a-zA-Z\s.'-]+$/.test(potentialName)) {
            recruiterName = potentialName;
        }
        // Attempt to find a title following common patterns if not already found
        const titleMatch = textContent.match(recruiterKeywords);
        if (titleMatch && title.toLowerCase() === "recruiter") { // only overwrite default if a better keyword is found
            // Extract a slightly longer phrase for title if possible
            const titlePhraseMatch = textContent.substring(titleMatch.index).match(/^([a-zA-Z\s]+(\s(lead|manager|specialist|partner))?)/i);
            if (titlePhraseMatch && titlePhraseMatch[0].length < 70) {
                title = titlePhraseMatch[0].trim();
            } else if (titleMatch[0].length < 70) {
                 title = titleMatch[0];
            }
        }
      }


      if (emails.length > 0 || linkedInProfiles.size > 0) {
        recruiters.push({
          recruiterName,
          companyName: companyNameQuery, 
          title,
          email: emails[0] || 'N/A', 
          linkedInProfileUrl: linkedInProfiles.size > 0 ? Array.from(linkedInProfiles)[0] : undefined,
          notes: `Found on: ${pageUrl}. Context: ${textContent.substring(0,100)}...`,
        });
      }
    }
  });
  return recruiters.slice(0, MAX_RESULTS_PER_PAGE);
}

async function crawlCompanySite(companyUrl: string, companyName: string, maxDepth: number = 1): Promise<ScrapedRecruiter[]> {
  const visited = new Set<string>();
  const queue: { url: string; depth: number }[] = [];
  let allRecruiters: ScrapedRecruiter[] = [];
  
  const initialUrl = normalizeUrl(companyUrl, companyUrl);
  if (!initialUrl) {
    console.error("Invalid starting URL for crawlCompanySite:", companyUrl);
    return [];
  }
  queue.push({ url: initialUrl, depth: 0 });
  visited.add(initialUrl);

  const baseHostname = new URL(initialUrl).hostname;

  while (queue.length > 0 && visited.size <= MAX_PAGES_TO_VISIT && allRecruiters.length < MAX_RESULTS_PER_PAGE * 2) {
    const current = queue.shift();
    if (!current) continue;

    const { url: currentUrl, depth } = current;
    console.log(`Crawling (depth ${depth}): ${currentUrl}`);

    const htmlContent = await fetchPageContent(currentUrl);
    if (htmlContent) {
      const foundRecruiters = extractRecruiterInfoFromPage(htmlContent, currentUrl, companyName);
      allRecruiters.push(...foundRecruiters);
      allRecruiters = Array.from(new Map(allRecruiters.map(r => [r.email + (r.linkedInProfileUrl || ''), r])).values()); 

      if (depth < maxDepth) {
        const $ = cheerioLoad(htmlContent);
        $('a[href]').each((_, element) => {
          const link = $(element).attr('href');
          if (link) {
            const nextUrl = normalizeUrl(link, currentUrl);
            if (nextUrl && new URL(nextUrl).hostname === baseHostname && !visited.has(nextUrl)) {
              if (/\b(career|job|contact|team|about|people|recruitment|talent)\b/i.test(nextUrl.toLowerCase())) { // Prioritize relevant links
                visited.add(nextUrl);
                queue.unshift({ url: nextUrl, depth: depth + 1 }); // Add to front of queue
              } else if (queue.length < MAX_PAGES_TO_VISIT * 2) { // Add less relevant links to back if queue is not too long
                 visited.add(nextUrl);
                 queue.push({ url: nextUrl, depth: depth + 1 });
              }
            }
          }
        });
      }
    }
  }
  return allRecruiters.slice(0, MAX_RESULTS_PER_PAGE * 2); 
}

export async function scrapeRecruiters(input: ScrapeRecruitersInput): Promise<ScrapeRecruitersOutput> {
  const { query, source, maxResults = 5 } = input;
  let recruiters: ScrapedRecruiter[] = [];
  let statusMessage = "";

  if (!query || query.trim() === "") {
    return { scrapedRecruiters: [], statusMessage: "Query cannot be empty." };
  }

  try {
    if (source === 'linkedin') {
      if (query.includes("linkedin.com/in/") || query.includes("linkedin.com/company/")) {
         const htmlContent = await fetchPageContent(query);
         if(htmlContent){
            let companyNameGuess = "LinkedIn Source"; // Default
            try {
                const urlObj = new URL(query);
                if (query.includes("linkedin.com/company/")) {
                    const pathParts = urlObj.pathname.split('/');
                    if (pathParts.length > 2 && pathParts[1] === 'company') {
                        companyNameGuess = pathParts[2].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    }
                } else if (query.includes("linkedin.com/in/")) {
                     // For individual profiles, company name isn't directly in URL.
                     // extractRecruiterInfoFromPage will try to get it from content if possible.
                     // We can't reliably get company name from /in/ URL.
                     // So, companyNameQuery passed to extractRecruiterInfoFromPage might be less specific.
                }
            } catch { /* ignore URL parsing errors for guess */ }

            recruiters = extractRecruiterInfoFromPage(htmlContent, query, companyNameGuess);
            if (recruiters.length > 0) {
                statusMessage = `Successfully extracted ${recruiters.length} potential recruiter(s) from the LinkedIn page.`;
            } else {
                statusMessage = "Fetched the LinkedIn page, but could not extract specific recruiter information. The profile/page might not contain clear recruiter indicators, or the information might be protected or require login for full access.";
            }
         } else {
            statusMessage = "Failed to fetch the LinkedIn page. The page may be private, require login, have scraping protections, or an error occurred. Ensure the URL is correct and publicly accessible if possible.";
         }
      } else {
        statusMessage = "For LinkedIn source, please provide a direct LinkedIn profile URL (e.g., https://linkedin.com/in/profilename) or a company page URL (e.g., https://linkedin.com/company/companyname). General LinkedIn searches are not supported by this tool.";
      }
    } else if (source === 'company_site') {
      let companyTargetUrl: string;
      let derivedCompanyName: string;

      if (!isValidUrl(query)) {
        derivedCompanyName = query;
        const sanitizedQuery = derivedCompanyName
            .toLowerCase()
            .replace(/\b(inc|llc|ltd|corp|corporation|co|company|gmbh|bv|ag|pty|plc)\.?\s*$/g, '') 
            .trim()
            .replace(/\s+/g, '-') 
            .replace(/[^a-z0-9.-]/g, ''); 
        
        if (!sanitizedQuery) {
            return { scrapedRecruiters: [], statusMessage: `Invalid company name provided: "${query}".` };
        }
        companyTargetUrl = `https://www.${sanitizedQuery}.com`;
        if (!await fetchPageContent(companyTargetUrl)) { // Check if www exists, if not try without
             companyTargetUrl = `https://${sanitizedQuery}.com`;
        }
        statusMessage = `Attempting to scrape company site for "${derivedCompanyName}" starting at ${companyTargetUrl}.`;
      } else {
        companyTargetUrl = query;
        try {
            const tempUrl = new URL(companyTargetUrl);
            derivedCompanyName = tempUrl.hostname.replace(/^www\./, '').split('.')[0]; 
            // Capitalize derived company name
            derivedCompanyName = derivedCompanyName.charAt(0).toUpperCase() + derivedCompanyName.slice(1);
        } catch {
            return { scrapedRecruiters: [], statusMessage: `Invalid company URL provided: ${companyTargetUrl}`};
        }
        statusMessage = `Scraping company site ${companyTargetUrl}.`;
      }
      
      recruiters = await crawlCompanySite(companyTargetUrl, derivedCompanyName);
      statusMessage += ` Found ${recruiters.length} potential recruiters from ${companyTargetUrl}.`;

    } else { // general_web
        if (isValidUrl(query)) {
            const htmlContent = await fetchPageContent(query);
            if (htmlContent) {
              const companyNameGuess = new URL(query).hostname.split('.')[0]; 
              recruiters = extractRecruiterInfoFromPage(htmlContent, query, companyNameGuess);
              statusMessage = `Fetched and scraped content from URL ${query}. Found ${recruiters.length} potential recruiters.`;
            } else {
              statusMessage = `Could not fetch content from the provided URL: ${query}. It might be inaccessible or not HTML.`;
            }
        } else {
            // For general search terms, we'll try a Google search and scrape the first few results' pages
            // This is a more complex operation and still has limitations.
            statusMessage = `Attempting general web search for "${query}". This may take longer and results vary.`;
            const googleSearchQuery = `"${query}" recruiter OR "talent acquisition" OR "hiring manager" contact OR careers`;
            const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(googleSearchQuery)}&num=5`; // Get top 5 results

            const googleResultsHtml = await fetchPageContent(googleSearchUrl);
            if (googleResultsHtml) {
                const $ = cheerioLoad(googleResultsHtml);
                const resultLinks: string[] = [];
                // Google search result links are typically in <h3> elements within <a> tags or specific div structures.
                // This selector is highly dependent on Google's current HTML structure and may break.
                $('a[href^="/url?q="]').each((_, element) => {
                    const href = $(element).attr('href');
                    if (href) {
                        const actualUrlMatch = href.match(/url\?q=([^&]+)&/);
                        if (actualUrlMatch && actualUrlMatch[1]) {
                           if(isValidUrl(actualUrlMatch[1])) resultLinks.push(decodeURIComponent(actualUrlMatch[1]));
                        }
                    }
                });
                
                if (resultLinks.length > 0) {
                    statusMessage += ` Found ${resultLinks.length} potential pages from Google. Scraping them now...`;
                    let pagesScrapedCount = 0;
                    for (const link of resultLinks.slice(0, 3)) { // Scrape top 3 links from search
                        if (allRecruiters.length >= maxResults) break;
                        const siteHtml = await fetchPageContent(link);
                        if (siteHtml) {
                            pagesScrapedCount++;
                            const companyNameGuess = new URL(link).hostname.split('.')[0] || query;
                            const foundOnPage = extractRecruiterInfoFromPage(siteHtml, link, companyNameGuess);
                            recruiters.push(...foundOnPage);
                            // Deduplicate immediately
                            recruiters = Array.from(new Map(recruiters.map(r => [(r.email || '') + (r.linkedInProfileUrl || ''), r])).values());
                        }
                    }
                    statusMessage += ` Scraped ${pagesScrapedCount} pages. Found ${recruiters.length} total potential recruiters.`;
                } else {
                    statusMessage += ` No direct links found in Google search results. Try a more specific query or a direct URL.`;
                }
            } else {
                statusMessage += ` Failed to fetch Google search results. Please try again or use a direct URL.`;
            }
        }
    }

    const uniqueRecruiters = Array.from(new Map(recruiters.map(r => [(r.email || '') + (r.linkedInProfileUrl || ''), r])).values());
    
    return {
      scrapedRecruiters: uniqueRecruiters.slice(0, maxResults),
      statusMessage: statusMessage || `Scraping process completed. Found ${uniqueRecruiters.length} unique potential recruiters.`,
    };

  } catch (error) {
    console.error("Error in scrapeRecruiters:", error);
    return {
      scrapedRecruiters: [],
      statusMessage: `An error occurred during scraping: ${error instanceof Error ? error.message : 'Unknown error'}. Check server logs.`,
    };
  }
}

// Helper for crawlCompanySite, ensures allRecruiters is defined in outer scope
let allRecruiters: ScrapedRecruiter[] = [];
