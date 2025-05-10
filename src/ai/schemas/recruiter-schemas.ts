
import { z } from 'genkit';

// Define a schema for the data returned by the scraper, matching Omit<Recruiter, 'id' | 'status' | 'lastContacted'>
export const ScrapedRecruiterSchema = z.object({
  recruiterName: z.string().describe('The name of the recruiter.'),
  companyName: z.string().describe('The company the recruiter works for.'),
  title: z.string().describe('The recruiter\'s title.'),
  email: z.string().email().optional().describe('The recruiter\'s email address (optional, might be N/A).').or(z.literal('N/A')),
  linkedInProfileUrl: z.string().url().optional().describe('The URL of the recruiter\'s LinkedIn profile.'),
  notes: z.string().optional().describe('Additional notes or profile information about the recruiter.'),
});
export type ScrapedRecruiter = z.infer<typeof ScrapedRecruiterSchema>;


export const ScrapeRecruitersInputSchema = z.object({
  query: z.string().describe('The search query. For "linkedin", provide a direct LinkedIn URL. For "company_site", provide a company name or website URL. For "general_web", provide a keyword/search term or a direct URL to scrape.'),
  source: z.enum(['linkedin', 'general_web', 'company_site']).default('general_web').describe('The primary source to target for scraping. "linkedin" for specific LinkedIn URLs, "company_site" to crawl a company website, "general_web" for keyword searches (uses Google) or direct URL scraping.'),
  maxResults: z.number().int().positive().optional().default(5).describe('Maximum number of distinct recruiters to attempt to return.'),
});
export type ScrapeRecruitersInput = z.infer<typeof ScrapeRecruitersInputSchema>;

export const ScrapeRecruitersOutputSchema = z.object({
  scrapedRecruiters: z.array(ScrapedRecruiterSchema).describe('A list of recruiters found based on the query.'),
  statusMessage: z.string().describe('A message indicating the outcome of the scraping process (e.g., success, partial success, warnings).'),
});
export type ScrapeRecruitersOutput = z.infer<typeof ScrapeRecruitersOutputSchema>;

export const PersonalizeEmailInputSchema = z.object({
  recruiterProfile: z
    .string()
    .describe('The recruiter profile information to personalize the email. This includes name, title, company, and any notes.'),
  yourSkills: z
    .string()
    .describe('Your skills and experiences to include in the email.'),
  template: z.string().describe('The base email template content (subject and body) to use as a starting point for personalization. The AI should refer to this template but generate its own personalized version. Expected format: "Subject: <subject_line>\\n\\n<email_body>"'),
});
export type PersonalizeEmailInput = z.infer<typeof PersonalizeEmailInputSchema>;

export const PersonalizeEmailOutputSchema = z.object({
  subject: z.string().describe('The personalized email subject line.'),
  body: z.string().describe('The personalized email body content.'),
});
export type PersonalizeEmailOutput = z.infer<typeof PersonalizeEmailOutputSchema>;
