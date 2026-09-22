import type { Metadata } from 'next';
import { SeoLandingPage } from '../components/SeoLandingPage';
export const metadata: Metadata = { title: 'Hotel Reputation Management with AI', description: 'AI-assisted reputation management for hotels: organize guest feedback, identify recurring issues and support review workflows.', keywords: ['hotel reputation management','hotel review management','hotel guest feedback'], alternates: { canonical: 'https://filtraai.com/hotel-reputation-management' } };
export default function Page() { return <SeoLandingPage eyebrow="For hotels" title="Hotel reputation management with AI" intro="Help hotel teams turn guest feedback into actionable information and build a consistent workflow around customer experience and reviews." keywords={['hotel reputation','guest feedback','hotel reviews','hospitality']} sections={[
{title:'Find recurring guest issues',body:'Organize feedback so hotel teams can see recurring complaints, positive themes and areas where service processes may need attention.'},
{title:'Support front-line teams',body:'AI-assisted suggestions can give teams a starting point when responding to difficult guest feedback, while managers retain control over the final response.'},
{title:'Connect the review journey',body:'Give guests a dedicated review experience and provide a clear path for positive experiences to reach the hotel’s public review presence.'},
{title:'Useful for independent and growing hotels',body:'Support hospitality businesses that need a simple way to organize reputation operations without building a custom system.'}]} faqs={[
{question:'Why does hotel reputation management matter?',answer:'Guest feedback can reveal service problems, recurring themes and positive experiences useful for operational improvement.'},
{question:'Can Filtra.AI be used by a hotel?',answer:'Yes. The platform is designed for businesses that depend on customer experience, including hospitality.'},
{question:'Does the trial require a credit card?',answer:'No. The Filtra.AI trial is 7 days without a credit card.'}]}/>; }
