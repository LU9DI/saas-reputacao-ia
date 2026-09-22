import type { Metadata } from 'next';
import { SeoLandingPage } from '../components/SeoLandingPage';
export const metadata: Metadata = { title: 'AI Reputation Management Software', description: 'Monitor customer feedback, understand reputation signals and organize review management with Filtra.AI.', keywords: ['AI reputation management','reputation management software','online reputation management'], alternates: { canonical: 'https://filtraai.com/ai-reputation-management' } };
export default function Page() { return <SeoLandingPage eyebrow="AI reputation management" title="AI reputation management for businesses" intro="Filtra.AI helps businesses collect feedback, analyze customer sentiment and organize reputation management from one web dashboard." keywords={['AI reputation management','online reputation','customer feedback','review management']} sections={[
{title:'Turn feedback into operational insight',body:'Collect customer feedback through a dedicated review experience and identify recurring issues, positive themes and opportunities for improvement.'},
{title:'AI-assisted review management',body:'Use AI support to summarize feedback and suggest responses to negative experiences, giving teams a faster starting point for customer communication.'},
{title:'Built for local businesses',body:'The workflow is designed for businesses that depend on customer experience and public reviews, including hotels, restaurants and services.'},
{title:'Start without a credit card',body:'Create an account and test the platform for 7 days. After the trial, choose a plan that fits your operation.'}]} faqs={[
{question:'What is AI reputation management?',answer:'It is software-assisted use of customer feedback and AI to organize reputation signals, identify patterns and support review workflows.'},
{question:'Can Filtra.AI help with negative reviews?',answer:'Filtra.AI can organize negative feedback and provide AI-assisted suggestions for responses and analysis.'},
{question:'Is there a free trial?',answer:'Yes. Filtra.AI offers a 7-day trial without requiring a credit card.'}]}/>; }
