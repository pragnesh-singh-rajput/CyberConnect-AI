'use server';

import { load as cheerioLoad } from 'cheerio';
import { URL } from 'url';
import type { ScrapedRecruiter, ScrapeRecruitersInput, ScrapeRecruitersOutput } from '@/ai/schemas/recruiter-schemas';

// Constants for limiting pages, results, and setting request timeouts
const MAX_PAGES_TO_VISIT_COMPANY_CRAWL = 5; // Max pages for company site crawl
const MAX_RESULTS_PER_PAGE_EXTRACTION = 10; // Max recruiters to extract from a single page
const MAX_GOOGLE_RESULTS_TO_PROCESS = 5; // Max Google search results to process for 'general_web' keyword search
const REQUEST_TIMEOUT = 10000; // 10 seconds

// Utility function to extract emails from text
function extractEmails(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return Array.from(new Set(text.match(emailRegex) || []));
}

// Function to check if a URL is valid
function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Normalize URLs to ensure they are absolute and clean
function normalizeUrl(urlString: string, baseUrl: string): string | null {
  try {
    const url = new URL(urlString, baseUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    url.hash = ''; // Remove fragment identifiers
    return url.href;
  } catch {
    return null;
  }
}

// Function to fetch page content with timeout handling and better User-Agent
async function fetchPageContent(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
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

// Extract recruiter info from a single page's HTML content
function extractRecruiterInfoFromPage(htmlContent: string, pageUrl: string, companyNameQuery: string): ScrapedRecruiter[] {
  const $ = cheerioLoad(htmlContent);
  const recruiters: ScrapedRecruiter[] = [];
  const potentialRecruitersText = new Set<string>();

  // Try to find a more relevant company name from the page title or meta tags if companyNameQuery is generic
  let pageSpecificCompanyName = companyNameQuery;
  const titleCompanyNameMatch = $('title').text().match(/([\w\s-]+ Careers|Jobs at [\w\s-]+|[\w\s-]+ Talent)/i);
  if (titleCompanyNameMatch && titleCompanyNameMatch[1]) {
    pageSpecificCompanyName = titleCompanyNameMatch[1]
        .replace(/ Careers|Jobs at | Talent/i, '')
        .trim();
  }


  $('body').find('*').each((_, element) => {
    const $el = $(element);
    const textContent = $el.text().replace(/\s\s+/g, ' ').trim();
    // Enhanced keywords, looking for common recruiter titles
    const recruiterKeywords = /\b(recruiter|talent acquisition|sourcer|hiring manager|technical recruiter|hr business partner|people operations|staffing|head of talent|talent partner|recruitment specialist|talent lead)\b/i;

    if (recruiterKeywords.test(textContent) && textContent.length < 500) { // Keep context length reasonable
      const uniqueTextKey = textContent.substring(0, 100); // Key for deduplication
      if (potentialRecruitersText.has(uniqueTextKey)) return;
      potentialRecruitersText.add(uniqueTextKey);

      const emails = extractEmails($el.html() || '');
      const linkedInProfiles = new Set<string>();
      $el.find('a[href*="linkedin.com/in/"]').each((_, linkEl) => {
        const href = $(linkEl).attr('href');
        if (href) {
          const normalizedLinkedInUrl = normalizeUrl(href, pageUrl);
          if (normalizedLinkedInUrl) linkedInProfiles.add(normalizedLinkedInUrl);
        }
      });

      let recruiterName = "Unknown";
      let title = "Recruiter"; // Default title

      // Try to parse Name - Title patterns
      const nameTitleMatch = textContent.match(/^([a-zA-Z\s.'-]+(?:[a-zA-Z]\.?){0,2})\s*[,-–—|]\s*([a-zA-Z\s&()]+)/i);
      if (nameTitleMatch && nameTitleMatch[1] && nameTitleMatch[2]) {
        recruiterName = nameTitleMatch[1].trim();
        title = nameTitleMatch[2].trim();
        // Further clean title if it contains the name
        if (title.toLowerCase().startsWith(recruiterName.toLowerCase())) {
            title = title.substring(recruiterName.length).replace(/^[\s,-]+/, '').trim();
        }
      } else {
        // Fallback: try to find name near keyword
        const keywordMatch = textContent.match(recruiterKeywords);
        if (keywordMatch && keywordMatch.index && keywordMatch.index > 0) {
            const textBeforeKeyword = textContent.substring(0, keywordMatch.index).trim();
            const potentialNameSegments = textBeforeKeyword.split(/\s+/);
            // Take last 2-3 words as potential name
            const potentialName = potentialNameSegments.slice(-3).join(' '); 
            if (potentialName.length > 3 && potentialName.length < 50 && /^[a-zA-Z\s.'-]+$/.test(potentialName)) {
                recruiterName = potentialName;
            }
        }
         const titleMatch = textContent.match(recruiterKeywords);
        if (titleMatch && title.toLowerCase() === "recruiter") { // Only update title if it's still the default
            const titlePhraseMatch = textContent.substring(titleMatch.index).match(/^([a-zA-Z\s&()]+(\s(lead|manager|specialist|partner))?)/i);
            if (titlePhraseMatch && titlePhraseMatch[0].length < 70) {
                title = titlePhraseMatch[0].trim();
            } else if (titleMatch[0].length < 70) {
                 title = titleMatch[0];
            }
        }
      }
      
      if (recruiterName === "Unknown" && linkedInProfiles.size > 0) {
        // Try to derive name from LinkedIn URL
        const liUrl = Array.from(linkedInProfiles)[0];
        const liPath = new URL(liUrl).pathname;
        const nameFromLi = liPath.split('/in/')[1]?.split('/')[0]?.replace(/-/g, ' ');
        if (nameFromLi) {
          recruiterName = nameFromLi.split(' ').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' ');
        }
      }


      if (emails.length > 0 || linkedInProfiles.size > 0) {
        recruiters.push({
          recruiterName,
          companyName: pageSpecificCompanyName || "N/A",
          title,
          email: emails[0] || 'N/A',
          linkedInProfileUrl: linkedInProfiles.size > 0 ? Array.from(linkedInProfiles)[0] : undefined,
          notes: `Found on: ${pageUrl}. Context: ${textContent.substring(0, 150)}...`, // Increased context
        });
      }
    }
  });
  return recruiters.slice(0, MAX_RESULTS_PER_PAGE_EXTRACTION);
}

// Function to crawl a company site
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

  while (queue.length > 0 && visited.size <= MAX_PAGES_TO_VISIT_COMPANY_CRAWL && allRecruiters.length < MAX_RESULTS_PER_PAGE_EXTRACTION * 2) {
    const current = queue.shift();
    if (!current) continue;

    const { url: currentUrl, depth } = current;
    console.log(`Crawling (depth ${depth}): ${currentUrl}`);

    const htmlContent = await fetchPageContent(currentUrl);
    if (htmlContent) {
      const foundRecruiters = extractRecruiterInfoFromPage(htmlContent, currentUrl, companyName);
      allRecruiters.push(...foundRecruiters);
      // Deduplicate recruiters based on email or LinkedIn URL
      allRecruiters = Array.from(new Map(allRecruiters.map(r => [(r.email && r.email !== 'N/A' ? r.email : r.linkedInProfileUrl) || Math.random().toString(), r])).values());


      if (depth < maxDepth) {
        const $ = cheerioLoad(htmlContent);
        $('a[href]').each((_, element) => {
          const link = $(element).attr('href');
          if (link) {
            const nextUrl = normalizeUrl(link, currentUrl);
            // Stay on the same domain, ensure not visited, and prioritize relevant keywords
            if (nextUrl && new URL(nextUrl).hostname === baseHostname && !visited.has(nextUrl)) {
              if (/\b(career|job|contact|team|about|people|recruitment|talent|staff)\b/i.test(nextUrl.toLowerCase())) {
                visited.add(nextUrl);
                queue.unshift({ url: nextUrl, depth: depth + 1 }); // Prioritize relevant links
              } else if (queue.length < MAX_PAGES_TO_VISIT_COMPANY_CRAWL * 3) { // Limit queue size for general links
                 visited.add(nextUrl);
                 queue.push({ url: nextUrl, depth: depth + 1 });
              }
            }
          }
        });
      }
    }
  }
  return allRecruiters.slice(0, MAX_RESULTS_PER_PAGE_EXTRACTION * 2);
}

// Function to extract links from a Google search results page
async function extractLinksFromGoogleSearch(searchQuery: string): Promise<string[]> {
  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&num=10&hl=en`; // Get 10 results, force English
  console.log(`Performing Google search: ${googleSearchUrl}`);
  const htmlContent = await fetchPageContent(googleSearchUrl);
  if (!htmlContent) {
    console.warn("Failed to fetch Google search results.");
    return [];
  }

  const $ = cheerioLoad(htmlContent);
  const links: string[] = [];
  
  // Google's structure for search results can change. This targets common patterns.
  // Look for <a> tags that have an <h3> inside, or specific data attributes.
  $('a[href]').each((_, element) => {
    const $a = $(element);
    const href = $a.attr('href');
    
    if (href && href.startsWith('/url?q=')) { // Standard Google redirect URL
      const actualUrl = new URLSearchParams(href.substring(href.indexOf('?') + 1)).get('q');
      if (actualUrl && isValidUrl(actualUrl) && !actualUrl.includes("google.com/search")) { // Ensure it's a valid, non-Google search link
        const SITEDOMAINS_TO_FILTER = ['support.google.com', 'maps.google.com', 'policies.google.com', 'accounts.google.com'];
        if(!SITEDOMAINS_TO_FILTER.some(domain => actualUrl.includes(domain))) {
            links.push(actualUrl);
        }
      }
    } else if (href && $a.find('h3').length > 0 && isValidUrl(href) && !href.includes("google.com")) {
        // Direct links (less common now but good to check)
        links.push(href);
    }
  });
  
  const uniqueLinks = Array.from(new Set(links));
  console.log(`Found ${uniqueLinks.length} potential links from Google search.`);
  return uniqueLinks.slice(0, MAX_GOOGLE_RESULTS_TO_PROCESS); // Process a limited number of results
}


// Main scraping function that handles multiple sources
export async function scrapeRecruiters(input: ScrapeRecruitersInput): Promise<ScrapeRecruitersOutput> {
  const { query, source, maxResults = 5 } = input;
  let recruiters: ScrapedRecruiter[] = [];
  let statusMessage = "";

  if (!query || query.trim() === "") {
    return { scrapedRecruiters: [], statusMessage: "Scraping Cancelled: No Search Query provided." };
  }

  try {
    if (source === 'linkedin') {
      if (query.includes("linkedin.com/in/") || query.includes("linkedin.com/company/")) {
         const htmlContent = await fetchPageContent(query);
         if(htmlContent){
            let companyNameGuess = "LinkedIn Source"; // Default
            const urlObj = new URL(query);
            if (query.includes("linkedin.com/company/")) {
                const pathParts = urlObj.pathname.split('/');
                if (pathParts.length > 2 && pathParts[1] === 'company') {
                    companyNameGuess = pathParts[2].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                }
            } else if (query.includes("linkedin.com/in/")) {
                 // For individual profiles, company name might be harder to guess without more context
                 // extractRecruiterInfoFromPage will try to find it within the page.
                 companyNameGuess = "LinkedIn Profile"; 
            }
            recruiters = extractRecruiterInfoFromPage(htmlContent, query, companyNameGuess);
            statusMessage = `Successfully extracted ${recruiters.length} potential recruiter(s) from the LinkedIn page: ${query}.`;
         } else {
            statusMessage = `Failed to fetch LinkedIn page: ${query}. The page might be private, require login, or block scraping.`;
         }
      } else {
        statusMessage = "For LinkedIn source, please provide a direct LinkedIn profile or company URL (e.g., linkedin.com/in/name or linkedin.com/company/name).";
      }
    } else if (source === 'company_site') {
      let companyTargetUrl = query;
      // Attempt to derive company name from URL if it's a URL, otherwise use query as name.
      let derivedCompanyName = query;
      if (isValidUrl(query)) {
        companyTargetUrl = query;
        try {
          const urlParts = new URL(query).hostname.split('.');
          derivedCompanyName = urlParts.length > 1 ? urlParts[urlParts.length - 2] : urlParts[0];
          derivedCompanyName = derivedCompanyName.charAt(0).toUpperCase() + derivedCompanyName.slice(1);
        } catch { /* keep original query as company name */ }
      } else { // Assume query is company name, try to make it a URL
         companyTargetUrl = `https://www.${query.toLowerCase().replace(/\s+/g, '')}.com/careers`; // Guess common career page
         // Fallback if that doesn't work
         // This will be handled by fetchPageContent failing or crawlCompanySite if it's not a valid starting point.
      }
      
      recruiters = await crawlCompanySite(companyTargetUrl, derivedCompanyName);
      statusMessage = `Found ${recruiters.length} potential recruiters from company site search for: ${query}.`;
    } else if (source === 'general_web') {
      if (isValidUrl(query)) { // Direct URL scraping
        const htmlContent = await fetchPageContent(query);
        if (htmlContent) {
          // Try to get company name from domain for notes, but it's a generic scrape.
          let companyNameFromUrl = "Web Page";
          try { companyNameFromUrl = new URL(query).hostname; } catch {}
          recruiters = extractRecruiterInfoFromPage(htmlContent, query, companyNameFromUrl);
          statusMessage = `Scraped direct URL ${query}, found ${recruiters.length} recruiters.`;
        } else {
          statusMessage = `Failed to fetch content from URL: ${query}.`;
        }
      } else { // Keyword search using Google
        const links = await extractLinksFromGoogleSearch(query + " recruiter OR \"talent acquisition\" OR \"hiring manager\" contact OR email");
        if (links.length === 0) {
          statusMessage = `No relevant links found via Google search for keywords: "${query}". Try refining your search or using a direct URL.`;
        } else {
          statusMessage = `Found ${links.length} potential pages from Google for "${query}". Processing...`;
          let processedLinks = 0;
          for (const link of links) {
            if (recruiters.length >= maxResults) break;
            console.log(`Processing Google search result: ${link}`);
            const htmlContent = await fetchPageContent(link);
            if (htmlContent) {
              // Try to derive company name from link domain for better context
              let companyNameGuess = query; // Fallback to original query
              try {
                const domain = new URL(link).hostname.replace(/^www\./, '').split('.')[0];
                companyNameGuess = domain.charAt(0).toUpperCase() + domain.slice(1);
              } catch {}

              const foundOnPage = extractRecruiterInfoFromPage(htmlContent, link, companyNameGuess);
              recruiters.push(...foundOnPage);
              // Deduplicate
              recruiters = Array.from(new Map(recruiters.map(r => [(r.email && r.email !== 'N/A' ? r.email : r.linkedInProfileUrl) || Math.random().toString(), r])).values());

            }
            processedLinks++;
          }
           statusMessage = `Processed ${processedLinks} pages from Google search for "${query}". Found ${recruiters.length} total potential recruiters.`;
        }
      }
    } else {
      statusMessage = "Invalid source provided. Use 'linkedin', 'company_site', or 'general_web'.";
    }

    return {
      scrapedRecruiters: recruiters.slice(0, maxResults),
      statusMessage: statusMessage || "Scraping process completed.",
    };

  } catch (error) {
    console.error("Error in scrapeRecruiters:", error);
    return {
      scrapedRecruiters: [],
      statusMessage: `An error occurred during scraping: ${error instanceof Error ? error.message : 'Unknown error'}. Check console for details.`
    };
  }
}
