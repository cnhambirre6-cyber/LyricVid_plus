// Server component — exports generateStaticParams for the [id] segment.
//
// Convex IDs are generated at runtime, so we can't enumerate them at build
// time. Returning a placeholder satisfies Next.js's static-export requirement
// (prerenderRoutes.length > 0). The placeholder HTML is never served to real
// users — GitHub Pages' 404.html fallback loads the JS bundle for any unknown
// path, and the Next.js client router renders the correct workspace.

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ id: "__placeholder" }];
}

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
