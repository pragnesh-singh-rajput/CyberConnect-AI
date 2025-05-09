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
  template: z.string().describe('The base email template content (subject and body) to use as a starting point for personalization. The AI should refer to this template but generate its own personalized version.'),
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
3.  **Base Email Template**: An existing email template (which includes a subject and body) that serves as a starting point or inspiration.

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
    // Ensure output is not null, especially if the AI might fail or return unexpected results.
    // For robust error handling, you might check specific fields or use a try-catch here.
    if (!output || !output.subject || !output.body) {
        // Fallback or error logging
        console.error("AI did not return expected subject and body.", output);
        // Attempt to use template subject with basic replacements as a fallback
        // This part is a simplified fallback; a more robust solution might involve the original template's logic
        // or signaling an error to the user.
        const recruiterName = input.recruiterProfile.split(',')[0] || "Recruiter"; // Basic extraction
        const companyNameMatch = input.recruiterProfile.match(/at (.*?)\./);
        const companyName = companyNameMatch ? companyNameMatch[1] : "their company";

        const templateSubject = input.template.split('\n\n')[0]?.replace('Subject: ', '') || "Following Up";
        const fallbackSubject = templateSubject
            .replace(/{recruiter_name}/gi, recruiterName)
            .replace(/{company_name}/gi, companyName)
            .replace(/{your_name}/gi, "a Skilled Professional"); // Generic

        const fallbackBody = (input.template.split('\n\n').slice(1).join('\n\n') || "Please see details below.")
            .replace(/{recruiter_name}/gi, recruiterName)
            .replace(/{company_name}/gi, companyName)
            .replace(/{your_name}/gi, "a Skilled Professional")
            .replace(/{your_skills}/gi, input.yourSkills);

        return {
            subject: fallbackSubject,
            body: `[AI Personalization Issue - Fallback Content]\n\n${fallbackBody}`,
        };
    }
    return output;
  }
);
