'use server';

import { load as cheerioLoad } from 'cheerio';
import { URL } from 'url';
import type { ScrapedRecruiter, ScrapeRecruitersInput, ScrapeRecruitersOutput } from '@/ai/schemas/recruiter-schemas';

// Constants for limiting pages, results, and setting request timeouts
const MAX_PAGES_TO_VISIT_COMPANY_CRAWL = 3; 
const MAX_RESULTS_PER_PAGE_EXTRACTION = 5; 
const REQUEST_TIMEOUT = 10000; // 10 seconds

// Updated TARGET_SITES_CONFIG with direct search URL patterns
const TARGET_SITES_CONFIG = [
  { name: "LinkedIn", domain: "linkedin.com", noteSuffix: "via LinkedIn Search", searchUrlPattern: (query: string) => `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query + " recruiter OR talent acquisition")}&origin=GLOBAL_SEARCH_HEADER` },
  { name: "Indeed", domain: "indeed.com", noteSuffix: "via Indeed Job Search", searchUrlPattern: (query: string) => `https://www.indeed.com/jobs?q=${encodeURIComponent(query + " recruiter OR talent acquisition")}` },
  { name: "Glassdoor", domain: "glassdoor.com", noteSuffix: "via Glassdoor Search", searchUrlPattern: (query: string) => `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodeURIComponent(query + " recruiter OR talent acquisition")}` },
  { name: "ZipRecruiter", domain: "ziprecruiter.com", noteSuffix: "via ZipRecruiter Search", searchUrlPattern: (query: string) => `https://www.ziprecruiter.com/jobs-search?search=${encodeURIComponent(query + " recruiter OR talent acquisition")}` },
  { name: "Monster", domain: "monster.com", noteSuffix: "via Monster Job Search", searchUrlPattern: (query: string) => `https://www.monster.com/jobs/search/?q=${encodeURIComponent(query + " recruiter OR talent acquisition")}` },
  { name: "CareerBuilder", domain: "careerbuilder.com", noteSuffix: "via CareerBuilder Search", searchUrlPattern: (query: string) => `https://www.careerbuilder.com/jobs?keywords=${encodeURIComponent(query + " recruiter OR talent acquisition")}` },
  { name: "FlexJobs", domain: "flexjobs.com", noteSuffix: "via FlexJobs Search", searchUrlPattern: (query: string) => `https://www.flexjobs.com/search?search=${encodeURIComponent(query + " recruiter OR talent acquisition")}` },
  { name: "Torre.ai", domain: "torre.ai", noteSuffix: "via Torre.ai Search", searchUrlPattern: (query: string) => `https://torre.ai/search/people?q=${encodeURIComponent(query + " recruiter OR talent acquisition")}&aggregate=true` },
  { name: "OptimHire", domain: "optimhire.com", noteSuffix: "via OptimHire Search", searchUrlPattern: (query: string) => `https://www.optimhire.com/recruiters/search/${encodeURIComponent(query.replace(/\s+/g, '-').toLowerCase() + "-recruiters")}` }, // Adjusted pattern
  { name: "HelloSky", domain: "hellosky.com", noteSuffix: "via HelloSky Search", searchUrlPattern: (query: string) => `https://www.hellosky.com/remote-jobs/search/${encodeURIComponent(query.replace(/\s+/g, '-').toLowerCase())}` }, // Adjusted, might be more for jobs than recruiters directly
];


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
function extractRecruiterInfoFromPage(htmlContent: string, pageUrl: string, companyNameQuery: string, sourceSiteNote?: string): ScrapedRecruiter[] {
  const $ = cheerioLoad(htmlContent);
  const recruiters: ScrapedRecruiter[] = [];
  const potentialRecruitersText = new Set<string>();

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
    const recruiterKeywords = /\b(recruiter|talent acquisition|sourcer|hiring manager|technical recruiter|hr business partner|people operations|staffing|head of talent|talent partner|recruitment specialist|talent lead)\b/i;

    if (recruiterKeywords.test(textContent) && textContent.length < 500) { 
      const uniqueTextKey = textContent.substring(0, 100); 
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
      let title = "Recruiter"; 

      const nameTitleMatch = textContent.match(/^([a-zA-Z\s.'-]+(?:[a-zA-Z]\.?){0,2})\s*[,-–—|]\s*([a-zA-Z\s&()]+)/i);
      if (nameTitleMatch && nameTitleMatch[1] && nameTitleMatch[2]) {
        recruiterName = nameTitleMatch[1].trim();
        title = nameTitleMatch[2].trim();
        if (title.toLowerCase().startsWith(recruiterName.toLowerCase())) {
            title = title.substring(recruiterName.length).replace(/^[\s,-]+/, '').trim();
        }
      } else {
        const keywordMatch = textContent.match(recruiterKeywords);
        if (keywordMatch && keywordMatch.index && keywordMatch.index > 0) {
            const textBeforeKeyword = textContent.substring(0, keywordMatch.index).trim();
            const potentialNameSegments = textBeforeKeyword.split(/\s+/);
            const potentialName = potentialNameSegments.slice(-3).join(' '); 
            if (potentialName.length > 3 && potentialName.length < 50 && /^[a-zA-Z\s.'-]+$/.test(potentialName)) {
                recruiterName = potentialName;
            }
        }
         const titleMatch = textContent.match(recruiterKeywords);
        if (titleMatch && title.toLowerCase() === "recruiter") { 
            const titlePhraseMatch = textContent.substring(titleMatch.index).match(/^([a-zA-Z\s&()]+(\s(lead|manager|specialist|partner))?)/i);
            if (titlePhraseMatch && titlePhraseMatch[0].length < 70) {
                title = titlePhraseMatch[0].trim();
            } else if (titleMatch[0].length < 70) {
                 title = titleMatch[0];
            }
        }
      }
      
      if (recruiterName === "Unknown" && linkedInProfiles.size > 0) {
        const liUrl = Array.from(linkedInProfiles)[0];
        const liPath = new URL(liUrl).pathname;
        const nameFromLi = liPath.split('/in/')[1]?.split('/')[0]?.replace(/-/g, ' ');
        if (nameFromLi) {
          recruiterName = nameFromLi.split(' ').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' ');
        }
      }

      let notes = `Found on: ${pageUrl}. Context: ${textContent.substring(0, 150)}...`;
      if (sourceSiteNote) {
        notes = `Found ${sourceSiteNote}. Context: ${textContent.substring(0, 120)}...`;
      }


      if (emails.length > 0 || linkedInProfiles.size > 0) {
        if(recruiters.length < MAX_RESULTS_PER_PAGE_EXTRACTION) { // Limit per page
            recruiters.push({
              recruiterName,
              companyName: pageSpecificCompanyName || "N/A",
              title,
              email: emails[0] || 'N/A',
              linkedInProfileUrl: linkedInProfiles.size > 0 ? Array.from(linkedInProfiles)[0] : undefined,
              notes,
            });
        }
      }
    }
  });
  return recruiters; // Already limited by MAX_RESULTS_PER_PAGE_EXTRACTION in calling code
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
      const foundRecruiters = extractRecruiterInfoFromPage(htmlContent, currentUrl, companyName, `on ${baseHostname}`);
      allRecruiters.push(...foundRecruiters);
      allRecruiters = Array.from(new Map(allRecruiters.map(r => [(r.email && r.email !== 'N/A' ? r.email : r.linkedInProfileUrl) || Math.random().toString(), r])).values());


      if (depth < maxDepth) {
        const $ = cheerioLoad(htmlContent);
        $('a[href]').each((_, element) => {
          const link = $(element).attr('href');
          if (link) {
            const nextUrl = normalizeUrl(link, currentUrl);
            if (nextUrl && new URL(nextUrl).hostname === baseHostname && !visited.has(nextUrl)) {
              if (/\b(career|job|contact|team|about|people|recruitment|talent|staff)\b/i.test(nextUrl.toLowerCase())) {
                visited.add(nextUrl);
                queue.unshift({ url: nextUrl, depth: depth + 1 }); 
              } else if (queue.length < MAX_PAGES_TO_VISIT_COMPANY_CRAWL * 3) { 
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

// Main scraping function
export async function scrapeRecruiters(input: ScrapeRecruitersInput): Promise<ScrapeRecruitersOutput> {
  const { query, maxResults = 10 } = input; 
  let recruiters: ScrapedRecruiter[] = [];
  let statusMessages: string[] = [];

  if (!query || query.trim() === "") {
    return { scrapedRecruiters: [], statusMessage: "Scraping Cancelled: No Search Query provided." };
  }

  try {
    if (isValidUrl(query)) {
      // Direct URL processing
      statusMessages.push(`Query is a URL: ${query}. Attempting direct processing.`);
      const htmlContent = await fetchPageContent(query);
      if (htmlContent) {
        let companyNameFromUrl = "Web Page";
        let sourceNote = "on Web Page";
        try { 
          const hostname = new URL(query).hostname;
          companyNameFromUrl = hostname.replace(/^www\./, '').split('.')[0];
          companyNameFromUrl = companyNameFromUrl.charAt(0).toUpperCase() + companyNameFromUrl.slice(1);
          sourceNote = `on ${hostname}`;
        } catch {}
        
        if (query.includes("linkedin.com/in/") || query.includes("linkedin.com/company/")) {
            sourceNote = "on LinkedIn Page";
            recruiters = extractRecruiterInfoFromPage(htmlContent, query, companyNameFromUrl, sourceNote);
        } else {
            if (query.match(/career|jobs|about|contact/i) || !query.match(/\.\w{2,4}\//)) { 
                 recruiters = await crawlCompanySite(query, companyNameFromUrl);
            } else {
                 recruiters = extractRecruiterInfoFromPage(htmlContent, query, companyNameFromUrl, sourceNote);
            }
        }
        statusMessages.push(`Scraped direct URL ${query}, found ${recruiters.length} potential recruiters.`);
      } else {
        statusMessages.push(`Failed to fetch content from URL: ${query}.`);
      }
    } else {
      // Keyword search across predefined sites
      statusMessages.push(`Query is keywords: "${query}". Searching across configured sites.`);
      
      for (const siteConfig of TARGET_SITES_CONFIG) {
        if (recruiters.length >= maxResults) break;
        
        const searchUrl = siteConfig.searchUrlPattern(query);
        console.log(`Attempting to scrape from ${siteConfig.name}: ${searchUrl}`);
        statusMessages.push(`Attempting ${siteConfig.name} search...`);

        const htmlContent = await fetchPageContent(searchUrl);
        
        if (htmlContent) {
          let companyNameGuess = query.split(' ')[0]; 
          if (companyNameGuess.length < 2 && query.includes("at ")) { // try to get company from "role at company"
            companyNameGuess = query.split("at ")[1]?.split(" ")[0] || companyNameGuess;
          }
           if (companyNameGuess.length < 2) companyNameGuess = siteConfig.name.split('.')[0];


          const foundOnPage = extractRecruiterInfoFromPage(htmlContent, searchUrl, companyNameGuess, siteConfig.noteSuffix);
          if (foundOnPage.length > 0) {
            statusMessages.push(`Found ${foundOnPage.length} potential entries on ${siteConfig.name}.`);
            recruiters.push(...foundOnPage);
            recruiters = Array.from(new Map(recruiters.map(r => [(r.email && r.email !== 'N/A' ? r.email.toLowerCase() : r.linkedInProfileUrl?.toLowerCase()) || Math.random().toString(), r])).values());
          } else {
            statusMessages.push(`No specific recruiter info extracted directly from ${siteConfig.name} results page for "${query}".`);
          }
        } else {
          statusMessages.push(`Failed to fetch or process content from ${siteConfig.name} for query "${query}".`);
        }
        
        if (recruiters.length >= maxResults) {
            statusMessages.push(`Reached max results limit of ${maxResults}.`);
            break;
        }
      }
    }

    const finalStatusMessage = `Scraping process completed. ${statusMessages.join(' | ')}`;
    return {
      scrapedRecruiters: recruiters.slice(0, maxResults),
      statusMessage: `Found ${recruiters.length} potential recruiters. ${finalStatusMessage}`,
    };

  } catch (error) {
    console.error("Error in scrapeRecruiters:", error);
    return {
      scrapedRecruiters: [],
      statusMessage: `An error occurred during scraping: ${error instanceof Error ? error.message : 'Unknown error'}. Check console for details.`
    };
  }
}
