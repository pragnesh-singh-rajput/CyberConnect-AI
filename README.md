
# CyberConnect AI

CyberConnect AI is a Next.js application designed to streamline your job search by leveraging AI for email personalization and automating recruiter outreach.

## Features

- **AI Email Personalization**: Generates personalized cold emails based on recruiter profiles and your skills.
- **Automated Recruiter Scraping**: Scrapes recruiter information from various professional networking sites and job boards.
- **Recruiter Input Dashboard**: Manage target companies and recruiter details.
- **Email Template Editor**: Create and manage email templates with variable support.
- **Email Analytics Dashboard**: Track basic email campaign metrics.

## Tech Stack

- **Next.js**: React framework for server-side rendering and static site generation.
- **React**: JavaScript library for building user interfaces.
- **TypeScript**: Superset of JavaScript for type safety.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **ShadCN UI**: Re-usable UI components.
- **Genkit (Firebase Genkit)**: AI integration toolkit for building AI-powered features.
- **Lucide React**: Icon library.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

## Getting Started

### 1. Clone the Repository (if applicable)

If you're working from a cloned repository:
```bash
git clone <repository-url>
cd cyberconnect-ai 
```

### 2. Install Dependencies

Install the project dependencies using npm or yarn:

```bash
npm install
# or
yarn install
```

### 3. Set Up Environment Variables

The application uses Genkit for AI features, which typically requires API keys for AI providers (e.g., Google AI Studio for Gemini).

1.  Create a `.env` file in the root of your project by copying the `.env.example` file (if one exists, otherwise create an empty `.env` file).
    ```bash
    cp .env.example .env 
    # or, if .env.example doesn't exist:
    touch .env
    ```
2.  Add your API keys to the `.env` file. For Google AI, you'll typically need `GOOGLE_API_KEY`.
    ```env
    # .env
    GOOGLE_API_KEY=your_google_ai_api_key_here 
    ```
    You can obtain a Google AI API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

    **Note**: The `src/ai/genkit.ts` file initializes Genkit. Ensure it's configured for your desired AI provider and model if you deviate from the default (Gemini Flash).

### 4. Running the Application

The application consists of two main parts: the Next.js frontend and the Genkit AI backend (which runs its own development server for flows).

**A. Run the Next.js Development Server:**

This command starts the Next.js application, typically on `http://localhost:9002`.

```bash
npm run dev
# or
yarn dev
```

**B. Run the Genkit Development Server:**

In a **separate terminal window**, start the Genkit development server. This server hosts your AI flows and allows the Next.js app to call them.

```bash
npm run genkit:dev
# or to watch for changes in your AI flows:
npm run genkit:watch
# or
yarn genkit:dev
# or
yarn genkit:watch
```
This usually starts the Genkit server, and you'll see output indicating it's running (often on a different port like 4000 or as specified in Genkit's output). The Genkit Dev UI might be available at `http://localhost:4100` (check terminal output for the exact URL).

You need **both servers running** for the application to function fully, especially the AI-powered features.

## Project Structure

-   `src/app/`: Contains the Next.js pages and layouts (App Router).
-   `src/components/`: Reusable UI components.
    -   `src/components/ui/`: ShadCN UI components.
    -   `src/components/layout/`: Layout-specific components (e.g., PageHeader, SidebarNav).
    -   `src/components/recruits/`: Components related to recruiter management.
    -   `src/components/templates/`: Components for email template editing.
    -   `src/components/analytics/`: Components for the analytics dashboard.
-   `src/ai/`: Genkit related files.
    -   `src/ai/flows/`: Genkit flows for AI functionalities (e.g., email personalization, scraping).
    -   `src/ai/schemas/`: Zod schemas for flow inputs and outputs.
    -   `src/ai/genkit.ts`: Genkit initialization and configuration.
    -   `src/ai/dev.ts`: Entry point for the Genkit development server.
-   `src/contexts/`: React Context providers for global state management (e.g., Recruiters, Templates, API Usage).
-   `src/hooks/`: Custom React hooks.
-   `src/lib/`: Utility functions and libraries.
-   `src/config/`: Site configuration, like navigation items.
-   `src/types/`: TypeScript type definitions.
-   `public/`: Static assets.

## Using the Application

### Dashboard (`/`)
-   View a quick overview of your outreach statistics.
-   Access quick actions to navigate to other parts of the app.

### Recruiters Page (`/recruits`)
-   **Scrape Recruiters**:
    1.  Enter keywords (e.g., "Software Engineer Recruiter New York") or a direct company URL into the "Scraping Query" input field.
    2.  Click "Start Scraping". The application will attempt to find recruiter profiles from LinkedIn, Indeed, Glassdoor, and other configured job sites.
    3.  Newly found recruiters (not already in your list) will be added to the table.
-   **Manage Recruiters**:
    -   View your list of recruiters.
    -   **Add New Recruiter Manually**: Click the "Add New Recruiter" button.
    -   **Personalize & Send Email**: Click the "Send" icon (or similar action) in the table for a recruiter.
        -   A dialog will open allowing you to select a template and your skills.
        -   Click "Generate Personalized Email" to use AI to craft a custom email. *This consumes an API call from your daily limit.*
        -   Review and edit the generated subject and body.
        -   Click "Send Email". This will typically open your default email client (e.g., Outlook, Gmail) with the email pre-filled. The recruiter's status will be updated to "sent".
    -   **Edit Recruiter**: Modify existing recruiter details.
    -   **Delete Recruiter**: Remove a recruiter from your list.
    -   **Save (No Email)**: Save a recruiter to your list without immediately sending an email.
    -   **Mark as Replied**: Manually update a recruiter's status if you receive a reply.
    -   **View Sent Email**: See the content of the email that was personalized and marked as sent.

### Templates Page (`/templates`)
-   **Manage Email Templates**:
    -   View, edit, or delete existing email templates.
    -   Set a default template.
    -   Use placeholders like `{recruiter_name}`, `{company_name}`, `{your_name}`, and `{your_skills}` in your templates. The AI will use these for personalization.
-   **Add New Template**: Create new email templates.
-   **Update Your Skills**: Edit the "Your Skills" section. This text is used for the `{your_skills}` placeholder and provided to the AI for personalization.

### Analytics Page (`/analytics`)
-   Track basic metrics like total recruiters, emails sent, and reply rates.
-   View charts for "Emails Sent Over Time" and "Recruiter Status Distribution".
    *(Note: "Campaign Performance" chart might show placeholder data as campaign tracking is a more advanced feature not fully implemented).*

### Settings & Profile (`/settings`, `/profile`)
-   View and manage your application preferences and user profile (currently placeholder UI).

## AI Usage Limits
-   The application includes a daily limit on AI-powered email personalizations to prevent excessive API usage (default is 5 per day, configurable in `src/contexts/ApiUsageContext.tsx`).
-   You can monitor your remaining AI calls in the "Personalize Email" dialog.

## Building for Production

To build the application for production:

```bash
npm run build
# or
yarn build
```

This will create an optimized build in the `.next` folder.

## Starting the Production Server

After building, you can start the production server:

```bash
npm start
# or
yarn start
```

For a production deployment, you would typically deploy the Next.js application to a platform like Vercel, Netlify, or a custom Node.js server. The Genkit flows would also need to be deployed, often as serverless functions (e.g., Google Cloud Functions if using Firebase Genkit with Google AI). Consult the Genkit documentation for deployment best practices.

## Contributing

Contributions are welcome! Please follow standard Git practices:
1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add some feature'`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Open a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details (if one exists).
