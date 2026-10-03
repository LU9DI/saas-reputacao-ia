import { LanguageSwitcher } from '../components/LanguageSwitcher';

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="fixed right-4 top-4 z-50">
        <LanguageSwitcher compact />
      </div>
      {children}
    </>
  );
}
