import Link from 'next/link';

export function BlogBreadcrumb({ title }: { title: string }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-zinc-500">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href="/" className="hover:text-zinc-300">
            Início
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <Link href="/blog" className="hover:text-zinc-300">
            Blog
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" className="text-zinc-400">
          {title}
        </li>
      </ol>
    </nav>
  );
}
