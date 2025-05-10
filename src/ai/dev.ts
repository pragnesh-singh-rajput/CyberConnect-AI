
import { config } from 'dotenv';
config();

// Import schemas first if they are used by flows at definition time
// Though in this case, flows import schemas directly.
// import '@/ai/schemas/recruiter-schemas.ts'; 

import '@/ai/flows/personalize-email.ts';
import '@/ai/flows/scrape-recruiters-flow.ts';
