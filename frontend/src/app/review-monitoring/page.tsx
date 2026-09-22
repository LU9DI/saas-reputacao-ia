import type { Metadata } from 'next';
import { SeoLandingPage } from '../components/SeoLandingPage';
export const metadata: Metadata = { title: 'Review Monitoring Software', description: 'Organize customer reviews and feedback with Filtra.AI. Monitor reputation signals, analyze sentiment and support faster responses.', keywords: ['review monitoring software','customer review monitoring','online reviews'], alternates: { canonical: 'https://filtraai.com/review-monitoring' } };
export default function Page() { return <SeoLandingPage eyebrow="Review monitoring" title="Review monitoring software for growing businesses" intro="Keep customer feedback organized, spot recurring themes and give your team a clearer workflow for managing reputation." keywords={['review monitoring','customer reviews','feedback analysis','reputation']} sections={[
{title:'One place for feedback',body:'Organize ratings and comments in an operational workflow where your team can identify critical issues and reputation signals.'},
{title:'Understand what customers are saying',body:'Use AI-assisted analysis to identify themes in feedback and turn unstructured comments into information your team can act on.'},
{title:'Support better responses',body:'When customers report problems, the dashboard can provide context and AI-assisted response suggestions.'},
{title:'Designed for repeatable operations',body:'Use the same workflow across customer touchpoints and, where applicable, across multiple business units.'}]} faqs={[
{question:'What does review monitoring software do?',answer:'It helps businesses organize, analyze and act on customer review and feedback data instead of handling every review manually.'},
{question:'Who can use Filtra.AI?',answer:'Businesses that depend on customer experience and reputation can use it, including hospitality, restaurants, services and agencies.'},
{question:'How quickly can I start?',answer:'You can create a trial account directly from the Filtra.AI website and begin setting up your review workflow.'}]}/>; }
