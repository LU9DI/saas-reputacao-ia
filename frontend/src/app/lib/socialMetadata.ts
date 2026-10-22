export const OG_IMAGE_URL = 'https://filtraai.com/og-image.png';

export const OG_IMAGE_META = {
  url: OG_IMAGE_URL,
  width: 1200,
  height: 630,
  alt: 'Filtra.AI — Gestão de reputação online e avaliações Google',
};

export function buildTwitter(title: string, description: string) {
  return {
    card: 'summary_large_image' as const,
    title,
    description,
    images: [OG_IMAGE_URL],
  };
}
