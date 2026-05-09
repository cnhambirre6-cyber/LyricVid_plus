/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for GitHub Pages hosting
  output: "export",

  // GitHub Pages serves the site under /<repo-name>/
  basePath: "/LyricVid_plus",

  // Generate /page/index.html instead of /page.html so directory URLs work
  trailingSlash: true,

  images: {
    // next/image optimisation requires a server; disable for static export
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "**.convex.cloud" },
      { protocol: "https", hostname: "replicate.delivery" },
      { protocol: "https", hostname: "pbxt.replicate.delivery" },
    ],
  },
};

export default nextConfig;
