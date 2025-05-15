
# 🚀 CyberConnect AI

CyberConnect AI is a powerful AI-powered recruiter outreach assistant built with **Next.js** and **Firebase Genkit**. It helps job seekers automate the process of identifying recruiters, crafting personalized cold emails, and tracking outreach efforts – all from a single sleek dashboard.

---

## ✨ Features

* 🎯 **AI Email Personalization**: Craft cold emails tailored to recruiters using your skills and templates.
* 🧠 **Automated Recruiter Scraping**: Gather recruiter info from job sites and professional networks.
* 🧩 **Template Management**: Use dynamic placeholders for smarter, reusable outreach.
* 📊 **Analytics Dashboard**: Track outreach performance, email counts, and engagement.
* 🗂 **Recruiter Manager**: Add, edit, or delete recruiter entries with ease.
* 🔐 **Daily AI Usage Limits**: Prevent API overuse with built-in personalization limits.

---

## 🛠 Tech Stack

* ⚛️ [Next.js](https://nextjs.org/) – Server-side rendering and routing
* 🧬 [TypeScript](https://www.typescriptlang.org/) – Type-safe development
* 💨 [Tailwind CSS](https://tailwindcss.com/) – Rapid UI styling
* 🧱 [ShadCN UI](https://ui.shadcn.com/) – Elegant component library
* 🧠 [Firebase Genkit](https://firebase.google.com/genkit) – AI orchestration for backend flows
* 🧿 [Lucide Icons](https://lucide.dev/) – Icon library for UI flair

---

## 📦 Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/pragnesh-singh-rajput/CyberConnect-AI.git
cd CyberConnect-AI
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Configure Environment Variables

Create a `.env` file and add your credentials:

```env
GOOGLE_API_KEY=your_google_ai_api_key_here
```

> 📝 You can get your API key from [Google AI Studio](https://makersuite.google.com/).

---

## 🧪 Running the App

### A. Start the Next.js Dev Server

```bash
npm run dev
# or
yarn dev
```

> Default: [http://localhost:9002](http://localhost:9002)

### B. Start the Genkit Dev Server (AI Flows)

```bash
npm run genkit:dev
# or
yarn genkit:dev
```

> Genkit UI may be available at [http://localhost:4100](http://localhost:4100) (check your terminal output).

---

## 🗂 Project Structure

```
src/
├── app/                  # App routes (Next.js)
├── components/           # UI components
│   ├── ui/               # ShadCN UI components
│   ├── layout/           # PageHeader, SidebarNav, etc.
│   ├── recruits/         # Recruiter management UI
│   ├── templates/        # Email template editor
│   └── analytics/        # Charts, metrics
├── ai/                   # Genkit flows and schemas
│   ├── flows/            # Email generation, scraping
│   ├── schemas/          # Zod validation
│   ├── genkit.ts         # Genkit initialization
│   └── dev.ts            # Genkit dev server entry
├── contexts/             # Global state (Recruiters, Templates, API usage)
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
├── config/               # Navigation, site config
├── types/                # TypeScript interfaces
public/                   # Static assets
```

---

## 🧑‍💼 Using the Application

### Recruiters Page (`/recruits`)

* 🔍 Scrape recruiters using keywords or URLs
* ➕ Manually add recruiters
* ✉️ Personalize and send emails using AI
* 🧾 Track sent emails, replies, and statuses

### Templates Page (`/templates`)

* 📄 Manage and edit templates
* 🧠 Insert smart placeholders:

  * `{recruiter_name}`, `{company_name}`, `{your_name}`, `{your_skills}`

### Analytics (`/analytics`)

* 📈 View stats like emails sent, reply rate, and timeline trends

---

## 📊 AI Usage Limits

* Default: **5 personalizations/day**
* Configurable via `src/contexts/ApiUsageContext.tsx`

---

## 🏗 Building for Production

```bash
npm run build
# or
yarn build
```

Start production server:

```bash
npm start
# or
yarn start
```

> ✅ Deploy frontend with Vercel, Netlify, or Node server. Deploy Genkit flows using Google Cloud Functions or similar platforms.

---

## 🤝 Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit: `git commit -m "Add your feature"`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

Licensed under the [MIT License](LICENSE)

---