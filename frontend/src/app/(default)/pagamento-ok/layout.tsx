import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pagamento confirmado',
  robots: { index: false, follow: false },
};

export default function PaymentSuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
