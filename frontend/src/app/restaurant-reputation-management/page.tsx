import type { Metadata } from 'next';
import { SeoLandingPage } from '../components/SeoLandingPage';
export const metadata: Metadata = { title: 'Restaurant Reputation Management with AI', description: 'Manage restaurant feedback and reputation with AI-assisted analysis, review workflows and customer feedback insights.', keywords: ['restaurant reputation management','restaurant review management','restaurant feedback'], alternates: { canonical: 'https://filtraai.com/restaurant-reputation-management' } };
export default function Page() { return <SeoLandingPage eyebrow="For restaurants" title="Restaurant reputation management with AI" intro="Create a repeatable feedback workflow for restaurants, identify service patterns and support thoughtful responses to customer experiences." keywords={['restaurant reputation','restaurant reviews','customer feedback','food service']} sections={[
{title:'See patterns across customer feedback',body:'Identify recurring issues around service, food, wait times and the overall customer experience.'},
{title:'Turn complaints into operational signals',body:'Private feedback can give teams an opportunity to investigate issues and improve processes before deciding how to communicate publicly.'},
{title:'AI-assisted responses',body:'Use AI-generated suggestions as a starting point for empathetic responses, with your team keeping control over what is ultimately published.'},
{title:'Simple setup',body:'Create a trial account, configure the review experience and use the dashboard to begin organizing feedback.'}]} faqs={[
{question:'Is Filtra.AI suitable for restaurants?',answer:'Yes. Restaurants are a core use case because customer feedback and public reviews are important to the customer experience workflow.'},
{question:'Can it analyze negative feedback?',answer:'Yes. The dashboard can organize negative feedback and provide AI-assisted response and tagging support.'},
{question:'Is there a free trial?',answer:'Yes. You can start with a 7-day trial without a credit card.'}]}/>; }
