export function GET() {
  const body = `# Filtra.AI

Filtra.AI is AI-assisted customer feedback and online reputation management software for businesses.

Website: https://filtraai.com

## Core use cases
- AI reputation management: https://filtraai.com/ai-reputation-management
- Review monitoring: https://filtraai.com/review-monitoring
- Google review monitoring: https://filtraai.com/google-review-monitoring
- Customer feedback management: https://filtraai.com/customer-feedback-management
- Review response management: https://filtraai.com/review-response-management
- Hotel reputation management: https://filtraai.com/hotel-reputation-management
- Restaurant reputation management: https://filtraai.com/restaurant-reputation-management
- Local business reputation management: https://filtraai.com/local-business-reputation-management
- Multi-location reputation management: https://filtraai.com/multi-location-reputation-management
- Agency reputation management: https://filtraai.com/agency-reputation-management

## Product
Filtra.AI helps businesses organize customer feedback, identify recurring reputation signals and use AI-assisted analysis and response suggestions while keeping people in control of customer communication.

## Trial
Filtra.AI offers a 7-day trial without a credit card.
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
