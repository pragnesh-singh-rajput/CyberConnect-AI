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
    .describe('The recruiter profile information to personalize the email.'),
  yourSkills: z
    .string()
    .describe('Your skills and experiences to include in the email.'),
  template: z.string().describe('The email template to use.'),
});
export type PersonalizeEmailInput = z.infer<typeof PersonalizeEmailInputSchema>;

const PersonalizeEmailOutputSchema = z.object({
  personalizedEmail: z.string().describe('The personalized cold email.'),
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

  Given the recruiter's profile information, your skills, and the email template, generate a personalized cold email tailored to the recruiter.

  Recruiter Profile:
  {{recruiterProfile}}

  Your Skills:
  {{yourSkills}}

  Email Template:
  {{template}}

  Personalized Email:`, // Ensure the personalized email is returned
});

const personalizeEmailFlow = ai.defineFlow(
  {
    name: 'personalizeEmailFlow',
    inputSchema: PersonalizeEmailInputSchema,
    outputSchema: PersonalizeEmailOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
