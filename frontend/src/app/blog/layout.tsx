import { SeoPageHeader } from '../components/SeoPageHeader';

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SeoPageHeader />
      {children}
    </>
  );
}
