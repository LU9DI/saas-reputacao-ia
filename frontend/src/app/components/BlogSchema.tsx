import { serializeJsonLd } from '../lib/safeJsonLd';
import {
  buildBlogPosting,
  buildBreadcrumbList,
  type BlogPostingInput,
} from '../lib/blogSchema';

export function BlogSchema(props: BlogPostingInput) {
  const article = buildBlogPosting(props);
  const breadcrumb = buildBreadcrumbList(props.canonical, props.headline);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(article) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumb) }}
      />
    </>
  );
}
