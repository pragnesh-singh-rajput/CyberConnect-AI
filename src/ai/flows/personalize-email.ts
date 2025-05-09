'use server';

/**
 * @fileOverview AI-powered email personalization flow.
 *
 * - personalizeEmail - A function that takes recruiter profile information and generates a personalized cold email.
 * - PersonalizeEmailInput - The input type for the personalizeEmail function.
 * - PersonalizeEmailOutput - The return type for the personalizeEmail function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizeEmailInputSchema = z.object({
  recruiterProfile: z
    .string()
    .describe('The recruiter profile information to personalize the email. This includes name, title, company, and any notes.'),
  yourSkills: z
    .string()
    .describe('Your skills and experiences to include in the email.'),
  template: z.string().describe('The base email template content (subject and body) to use as a starting point for personalization. The AI should refer to this template but generate its own personalized version. Expected format: "Subject: <subject_line>\\n\\n<email_body>"'),
});
export type PersonalizeEmailInput = z.infer<typeof PersonalizeEmailInputSchema>;

const PersonalizeEmailOutputSchema = z.object({
  subject: z.string().describe('The personalized email subject line.'),
  body: z.string().describe('The personalized email body content.'),
});
export type PersonalizeEmailOutput = z.infer<typeof PersonalizeEmailOutputSchema>;

export async function personalizeEmail(input: PersonalizeEmailInput): Promise<PersonalizeEmailOutput> {
  return personalizeEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizeEmailPrompt',
  input: {schema: PersonalizeEmailInputSchema},
  output: {schema: PersonalizeEmailOutputSchema},
  prompt: `You are an AI email assistant specializing in generating personalized cold emails for job seekers.

Your goal is to create a compelling, personalized email subject and body.

You will be provided with:
1.  **Recruiter Profile**: Information about the recruiter (e.g., name, title, company, specific interests or notes).
2.  **Your Skills**: The job seeker's skills and experiences.
3.  **Base Email Template**: An existing email template (which includes a subject and body) that serves as a starting point or inspiration. The format is "Subject: <subject_line>\\n\\n<email_body>".

Analyze all this information to craft a unique and engaging email. The output must be a new subject line and a new email body, tailored to the specific recruiter. Make sure to replace placeholders like {recruiter_name}, {company_name}, {your_name}, and {your_skills} with relevant information or adapt them appropriately in the generated content.

Recruiter Profile:
{{recruiterProfile}}

Your Skills:
{{yourSkills}}

Base Email Template (use this as inspiration/guidance for structure and tone, but generate a new, personalized version):
{{template}}

Based on all the above, generate the personalized email subject and body.`,
});

const personalizeEmailFlow = ai.defineFlow(
  {
    name: 'personalizeEmailFlow',
    inputSchema: PersonalizeEmailInputSchema,
    outputSchema: PersonalizeEmailOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);

    if (!output || !output.subject || !output.body) {
        console.error("AI did not return expected subject and body. Using fallback.", output);
        
        // Extract recruiter name (assuming it's the first part of the profile string before a comma or is the whole string if no comma)
        const recruiterName = input.recruiterProfile.split(',')[0]?.trim() || "Recruiter";
        
        // Extract company name (look for "at CompanyName" pattern, resilient to punctuation)
        const companyNameMatch = input.recruiterProfile.match(/at\s(.*?)(?:,|\.|;|$)/i);
        const companyName = companyNameMatch && companyNameMatch[1] ? companyNameMatch[1].trim() : "their company";

        // Parse subject and body from the input.template string
        // which is expected to be "Subject: <subject_line>\n\n<email_body>"
        const templateParts = input.template.split('\n\n');
        let baseSubject = "Following Up"; // Default fallback subject
        let baseBody = templateParts.slice(1).join('\n\n') || "Please see details below.";

        if (templateParts[0]?.toLowerCase().startsWith('subject: ')) {
            baseSubject = templateParts[0].substring('subject: '.length).trim();
        } else if (templateParts.length > 1) { // If no "Subject:" prefix but multiple parts, assume first is subject.
            baseSubject = templateParts[0].trim();
        } else { // If only one part, assume it's all body.
           baseBody = input.template;
        }


        const fallbackSubject = baseSubject
            .replace(/{recruiter_name}/gi, recruiterName)
            .replace(/{company_name}/gi, companyName)
            .replace(/{your_name}/gi, "a Skilled Professional"); // Generic placeholder for user's name

        const fallbackBodyContent = baseBody
            .replace(/{recruiter_name}/gi, recruiterName)
            .replace(/{company_name}/gi, companyName)
            .replace(/{your_name}/gi, "a Skilled Professional") // Generic placeholder
            .replace(/{your_skills}/gi, input.yourSkills);

        return {
            subject: fallbackSubject,
            body: `[AI Personalization Issue - Fallback Content]\n\n${fallbackBodyContent}`,
        };
    }
    return output;
  }
);
