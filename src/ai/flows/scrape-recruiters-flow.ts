import fetch from 'node-fetch';
import { load as cheerioLoad } from 'cheerio';
import { URL } from 'url';
import { ScrapedRecruiter, ScrapeRecruitersInput, ScrapeRecruitersOutput } from '@/ai/schemas/recruiter-schemas';

const MAX_PAGES = 30;
const CRAWL_DEPTH = 2;

function extractEmails(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return [...new Set(text.match(emailRegex) || [])];
}

function isInternalLink(link: string, baseUrl: string): boolean {
  try {
    const url = new URL(link, baseUrl);
    return url.hostname === new URL(baseUrl).hostname;
  } catch {
    return false;
  }
}

async function fetchAndExtract(url: string, baseUrl: string): Promise<{ recruiters: ScrapedRecruiter[], links: string[] }> {
  const recruiters: ScrapedRecruiter[] = [];
  const links: string[] = [];

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status} - ${response.statusText}`);

    const html = await response.text();
    const $ = cheerioLoad(html);

    // Look for recruiter-type patterns
    $('*').each((_, el) => {
      const text = $(el).text();
      const match = /recruiter|talent|HR|hiring/i.test(text);

      if (match) {
        const email = extractEmails(text)[0] || 'unknown@example.com';
        const linkedin = $(el).find('a[href*="linkedin.com"]').attr('href');
        recruiters.push({
          recruiterName: text.substring(0, 100),
          companyName: 'Unknown',
          title: 'Recruiter-like Title',
          email,
          linkedInProfileUrl: linkedin,
          notes: `Detected recruiter info from: ${url}`
        });
      }
    });

    $('a[href]').each((_, el) => {
      const link = $(el).attr('href');
      if (link && isInternalLink(link, baseUrl)) {
        links.push(new URL(link, baseUrl).href);
      }
    });

  } catch (err) {
    console.warn(`Failed to fetch ${url}: ${err}`);
  }

  return { recruiters, links };
}

async function deepCrawl(startUrl: string, maxDepth: number, maxPages: number): Promise<ScrapedRecruiter[]> {
  const visited = new Set<string>();
  const queue: { url: string; depth: number }[] = [{ url: startUrl, depth: 0 }];
  const recruiters: ScrapedRecruiter[] = [];

  while (queue.length > 0 && visited.size < maxPages) {
    const { url, depth } = queue.shift()!;
    if (visited.has(url) || depth > maxDepth) continue;

    visited.add(url);
    const { recruiters: found, links } = await fetchAndExtract(url, startUrl);

    recruiters.push(...found);

    for (const link of links) {
      if (!visited.has(link)) {
        queue.push({ url: link, depth: depth + 1 });
      }
    }
  }

  return recruiters;
}

// Main export
export async function scrapeRecruiters(input: ScrapeRecruitersInput): Promise<ScrapeRecruitersOutput> {
  if (!input.query || !input.query.startsWith('http')) {
    return {
      scrapedRecruiters: [],
      statusMessage: 'Please provide a valid URL to crawl.'
    };
  }

  const recruiters = await deepCrawl(input.query, CRAWL_DEPTH, MAX_PAGES);
  return {
    scrapedRecruiters: recruiters.slice(0, input.maxResults ?? 10),
    statusMessage: `Scraping completed. Found ${recruiters.length} recruiter-like profiles.`
  };
}
