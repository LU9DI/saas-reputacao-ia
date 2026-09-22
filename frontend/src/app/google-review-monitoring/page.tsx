import type { Metadata } from 'next';
import { SeoLandingPage } from '../components/SeoLandingPage';
export const metadata: Metadata = { title: 'Google Review Monitoring and Management', description: 'Organize customer feedback and support Google review workflows with Filtra.AI and AI-assisted reputation management.', keywords: ['Google review monitoring','Google reviews management','review management software'], alternates: { canonical: 'https://filtraai.com/google-review-monitoring' } };
export default function Page() { return <SeoLandingPage eyebrow="Google Reviews" title="Google review monitoring and management" intro="Build a structured workflow around customer feedback and help your team manage the experience that leads to public reviews." keywords={['Google Reviews','review monitoring','feedback workflow','reputation management']} sections={[
{title:'Connect your review workflow',body:'Add your business Google review link and create a dedicated customer feedback path around public reviews.'},
{title:'Separate insight from action',body:'Use the dashboard to review feedback, identify critical themes and decide what operational action or response is appropriate.'},
{title:'AI assistance, human control',body:'AI can help summarize feedback and suggest responses, while your business remains responsible for reviewing communications.'},
{title:'Start with a 7-day trial',body:'Set up the workflow and evaluate whether Filtra.AI fits your reputation-management process before selecting a paid plan.'}]} faqs={[
{question:'Does Filtra.AI replace Google Reviews?',answer:'No. Filtra.AI supports the customer-feedback and reputation workflow; Google remains the public review platform.'},
{question:'Can I add my Google review link?',answer:'Yes. The business setup includes an optional Google Reviews link.'},
{question:'Does Filtra.AI automatically publish every response?',answer:'AI suggestions support the team. Businesses retain control over customer communications.'}]}/>; }
