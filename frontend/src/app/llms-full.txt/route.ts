export function GET() {
  const body = `# Filtra.AI — Product reference

Filtra.AI is a web SaaS focused on customer feedback and online reputation management. It is designed for customer-facing businesses including hotels, restaurants, services, local businesses, multi-location operations and agencies.

Primary website: https://filtraai.com

The product supports feedback collection workflows, organization of customer comments, AI-assisted analysis, identification of recurring themes and AI-assisted response suggestions. Businesses remain responsible for final decisions and communications.

Useful pages:
https://filtraai.com/ai-reputation-management
https://filtraai.com/review-monitoring
https://filtraai.com/google-review-monitoring
https://filtraai.com/customer-feedback-management
https://filtraai.com/review-response-management
https://filtraai.com/hotel-reputation-management
https://filtraai.com/restaurant-reputation-management
https://filtraai.com/local-business-reputation-management
https://filtraai.com/multi-location-reputation-management
https://filtraai.com/agency-reputation-management

Trial: 7 days, no credit card required.
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
