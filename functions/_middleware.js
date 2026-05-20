// Global Pages middleware — runs on every request.
// Funnels all alternate hostnames into the canonical spacecat.academy so
// Google only ever sees a single set of URLs.

const CANONICAL = 'spacecat.academy';

export const onRequest = async ({ request, next }) => {
  const url = new URL(request.url);
  const host = url.hostname;

  // 1) Cloudflare's auto-generated preview hostname *.pages.dev
  //    (can't be disabled from the dashboard)
  // 2) www subdomain
  if (host.endsWith('.pages.dev') || host === `www.${CANONICAL}`) {
    url.hostname = CANONICAL;
    return Response.redirect(url.toString(), 301);
  }

  return next();
};
