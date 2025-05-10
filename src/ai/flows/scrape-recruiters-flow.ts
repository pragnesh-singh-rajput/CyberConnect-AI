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
    const recruiterKeywords = /\b(recruiter|talent acquisition|sourcer|hiring manager|technical recruiter|hr business partner|people operations)\b/i;
    
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
      let title = "Recruiter";
      const nameTitleMatch = textContent.match(/^([^,-]+)[,-]\s*([^,-]+)/i);
      if (nameTitleMatch) {
        recruiterName = nameTitleMatch[1].trim();
        title = nameTitleMatch[2].trim();
      } else {
        const firstFewWords = textContent.split(/\s+/).slice(0,3).join(' ');
        if (firstFewWords.length < 50 && firstFewWords.length > 3) recruiterName = firstFewWords;
      }

      if (emails.length > 0 || linkedInProfiles.size > 0) {
        recruiters.push({
          recruiterName,
          companyName: companyNameQuery, 
          title,
          email: emails[0] || 'N/A', 
          linkedInProfileUrl: linkedInProfiles.size > 0 ? Array.from(linkedInProfiles)[0] : undefined,
          notes: `Found on: ${pageUrl}. Keywords: ${textContent.substring(0,100)}...`,
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
      allRecruiters = Array.from(new Map(allRecruiters.map(r => [r.email + r.linkedInProfileUrl, r])).values()); 

      if (depth < maxDepth) {
        const $ = cheerioLoad(htmlContent);
        $('a[href]').each((_, element) => {
          const link = $(element).attr('href');
          if (link) {
            const nextUrl = normalizeUrl(link, currentUrl);
            if (nextUrl && new URL(nextUrl).hostname === baseHostname && !visited.has(nextUrl)) {
              visited.add(nextUrl);
              queue.push({ url: nextUrl, depth: depth + 1 });
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
      statusMessage = "LinkedIn scraping is complex. This function attempts to extract info if a direct profile URL is provided. For general LinkedIn searches, please use LinkedIn directly.";
      if (query.includes("linkedin.com/in/")) { 
         const htmlContent = await fetchPageContent(query);
         if(htmlContent){
            const companyNameGuess = new URL(query).hostname; 
            recruiters = extractRecruiterInfoFromPage(htmlContent, query, companyNameGuess);
            statusMessage = recruiters.length > 0 ? "Extracted info from LinkedIn profile URL." : "Could not extract info from LinkedIn profile URL.";
         } else {
            statusMessage = "Failed to fetch LinkedIn profile page. Ensure the URL is correct and publicly accessible.";
         }
      } else {
        statusMessage = "The provided query for LinkedIn source is not a direct profile URL (e.g., https://linkedin.com/in/profilename). Please provide a direct profile URL for LinkedIn scraping.";
      }
    } else if (source === 'company_site') {
      let companyTargetUrl: string;
      let derivedCompanyName: string;

      if (!isValidUrl(query)) {
        // Query is not a URL, assume it's a company name.
        derivedCompanyName = query;
        // Sanitize and construct a plausible base URL.
        const sanitizedQuery = derivedCompanyName
            .toLowerCase()
            .replace(/\b(inc|llc|ltd|corp|corporation|co|company|gmbh|bv|ag)\.?\s*$/g, '') 
            .trim()
            .replace(/\s+/g, '-') 
            .replace(/[^a-z0-9.-]/g, ''); 
        
        if (!sanitizedQuery) {
            return { scrapedRecruiters: [], statusMessage: `Invalid company name provided: "${query}".` };
        }

        companyTargetUrl = `https://www.${sanitizedQuery}.com`;
        
        if (!isValidUrl(companyTargetUrl)) { 
            companyTargetUrl = `https://${sanitizedQuery}.com`;
            if(!isValidUrl(companyTargetUrl)){
                 return { scrapedRecruiters: [], statusMessage: `Could not construct a valid website URL from company name: "${derivedCompanyName}". Please provide a full company website URL or ensure the company name is standard.` };
            }
        }
        statusMessage = `Attempting to scrape company site for "${derivedCompanyName}" starting at ${companyTargetUrl}.`;
      } else {
        // Query is a URL.
        companyTargetUrl = query;
        try {
            const tempUrl = new URL(companyTargetUrl);
            derivedCompanyName = tempUrl.hostname.replace(/^www\./, '').split('.')[0]; 
        } catch {
            return { scrapedRecruiters: [], statusMessage: `Invalid company URL provided: ${companyTargetUrl}`};
        }
        statusMessage = `Scraping company site ${companyTargetUrl}.`;
      }
      
      recruiters = await crawlCompanySite(companyTargetUrl, derivedCompanyName);
      statusMessage += ` Found ${recruiters.length} potential recruiters.`;

    } else { // general_web
        if (isValidUrl(query)) {
            // If query is a URL, treat it as a single page to scrape
            const htmlContent = await fetchPageContent(query);
            if (htmlContent) {
              const companyNameGuess = new URL(query).hostname; // Best guess for company name
              recruiters = extractRecruiterInfoFromPage(htmlContent, query, companyNameGuess);
              statusMessage = `Fetched and scraped content from URL ${query}. Found ${recruiters.length} potential recruiters.`;
            } else {
              statusMessage = `Could not fetch content from the provided URL: ${query}.`;
            }
        } else {
            // If query is not a URL, it's a search term. Provide a Google search link.
            const searchTerm = query;
            const googleSearchQuery = `"${searchTerm}" recruiter OR "talent acquisition" OR "hiring manager" contact OR careers OR jobs`;
            const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(googleSearchQuery)}`;
            statusMessage = `For general search term "${searchTerm}", direct search engine scraping is not implemented due to its complexity and potential ToS violations. 
                             Please use the 'company_site' source for specific companies, or review search results manually using this link: ${googleUrl}.
                             Alternatively, provide a direct webpage URL to scrape.`;
            recruiters = []; // No programmatic scraping of search engine results
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
