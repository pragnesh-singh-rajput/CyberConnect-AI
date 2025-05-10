'use server';

import { load as cheerioLoad } from 'cheerio';
import { URL } from 'url';
import type { ScrapedRecruiter, ScrapeRecruitersInput, ScrapeRecruitersOutput } from '@/ai/schemas/recruiter-schemas';
// Removed: import fetch from 'node-fetch'; // Use global fetch instead

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
        'User-Agent': 'Mozilla/5.0 (compatible; CyberConnectAIBot/1.0; +http://example.com/bot)', // Adjust bot info
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
  const potentialRecruiters = new Set<string>(); // To avoid duplicate processing based on text

  // Search for common keywords associated with recruiters
  $('body').find('*').each((_, element) => {
    const $el = $(element);
    const textContent = $el.text().replace(/\s\s+/g, ' ').trim();

    // Keywords that might indicate a recruiter or talent acquisition role
    const recruiterKeywords = /\b(recruiter|talent acquisition|sourcer|hiring manager|technical recruiter|hr business partner|people operations)\b/i;
    
    if (recruiterKeywords.test(textContent) && textContent.length < 500) { // Avoid very large text blocks
      if (potentialRecruiters.has(textContent.substring(0,100))) return; // Basic deduplication
      potentialRecruiters.add(textContent.substring(0,100));

      const emails = extractEmails($el.html() || ''); // Search HTML for mailto links too
      const linkedInProfiles = new Set<string>();
      $el.find('a[href*="linkedin.com/in/"]').each((_, linkEl) => {
        const href = $(linkEl).attr('href');
        if (href) {
            const normalizedLinkedInUrl = normalizeUrl(href, pageUrl);
            if(normalizedLinkedInUrl) linkedInProfiles.add(normalizedLinkedInUrl);
        }
      });
      
      // Try to infer name and title more intelligently
      let recruiterName = "Unknown";
      let title = "Recruiter";
      // Simple pattern: "Name, Title" or "Name - Title"
      const nameTitleMatch = textContent.match(/^([^,-]+)[,-]\s*([^,-]+)/i);
      if (nameTitleMatch) {
        recruiterName = nameTitleMatch[1].trim();
        title = nameTitleMatch[2].trim();
      } else {
        // Fallback: try to get a name like string from the beginning
        const firstFewWords = textContent.split(/\s+/).slice(0,3).join(' ');
        if (firstFewWords.length < 50 && firstFewWords.length > 3) recruiterName = firstFewWords;
      }


      if (emails.length > 0 || linkedInProfiles.size > 0) {
        recruiters.push({
          recruiterName,
          companyName: companyNameQuery, // Use the company name from the query
          title,
          email: emails[0] || 'N/A', // Prefer first found email
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
      allRecruiters = Array.from(new Map(allRecruiters.map(r => [r.email + r.linkedInProfileUrl, r])).values()); // Deduplicate

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
  return allRecruiters.slice(0, MAX_RESULTS_PER_PAGE * 2); // Final limit
}

// Main export - Server Action
export async function scrapeRecruiters(input: ScrapeRecruitersInput): Promise<ScrapeRecruitersOutput> {
  const { query, source, maxResults = 5 } = input;
  let recruiters: ScrapedRecruiter[] = [];
  let statusMessage = "";

  if (!query || query.trim() === "") {
    return { scrapedRecruiters: [], statusMessage: "Query cannot be empty." };
  }

  try {
    if (source === 'linkedin') {
      // Note: Direct scraping of LinkedIn is against their ToS and technically challenging due to login requirements and bot detection.
      // This implementation will simulate a search or provide guidance.
      // For a real app, use LinkedIn's official APIs if available and permitted.
      statusMessage = "LinkedIn scraping is complex and not directly implemented. Consider manual search or official APIs. This function will attempt a general web search if a LinkedIn URL is not a direct profile.";
      if (query.includes("linkedin.com/in/")) { // If it's a direct profile URL
         const htmlContent = await fetchPageContent(query);
         if(htmlContent){
            const companyNameGuess = new URL(query).hostname; // Best guess
            recruiters = extractRecruiterInfoFromPage(htmlContent, query, companyNameGuess);
            statusMessage = recruiters.length > 0 ? "Extracted info from LinkedIn profile." : "Could not extract info from LinkedIn profile URL.";
         } else {
            statusMessage = "Failed to fetch LinkedIn profile page.";
         }
      } else {
        // Fallback to a Google search for LinkedIn profiles
        const searchQuery = `site:linkedin.com/in/ "recruiter" OR "talent acquisition" AND "${query}"`;
        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
        statusMessage += ` Performing a Google search for LinkedIn profiles: ${googleUrl} (manual review required).`;
        // Actual Google scraping is also problematic. This is illustrative.
        // For a real app, one might use a search API like SerpAPI.
      }
    } else if (source === 'company_site') {
      if (!isValidUrl(query)) {
        return { scrapedRecruiters: [], statusMessage: "Please provide a valid company website URL (e.g., https://www.company.com/careers)." };
      }
      const companyUrl = new URL(query);
      const companyName = companyUrl.hostname.replace(/^www\./, '').split('.')[0]; // Simple company name extraction
      
      recruiters = await crawlCompanySite(query, companyName);
      statusMessage = `Scraped company site ${query}. Found ${recruiters.length} potential recruiters.`;

    } else { // general_web
      // This would typically involve using a search engine API (e.g., Google Custom Search API, SerpAPI)
      // For this example, we'll do a very basic simulation by trying to fetch the query if it's a URL.
      statusMessage = "General web scraping is highly complex. This is a limited demonstration.";
      if (isValidUrl(query)) {
        const htmlContent = await fetchPageContent(query);
        if (htmlContent) {
          const companyNameGuess = new URL(query).hostname;
          recruiters = extractRecruiterInfoFromPage(htmlContent, query, companyNameGuess);
          statusMessage = `Fetched content from ${query}. Found ${recruiters.length} potential recruiters.`;
        } else {
          statusMessage = `Could not fetch content from URL: ${query}.`;
        }
      } else {
         statusMessage = "For 'general_web' source, provide a direct URL or use a more specific source. Search engine integration is not implemented in this demo.";
      }
    }

    // Deduplicate recruiters based on email and LinkedIn profile
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
