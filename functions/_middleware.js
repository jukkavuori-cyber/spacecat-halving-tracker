// Global Pages middleware — runs on every request.
// Forces all traffic on the .pages.dev preview domain to the canonical
// custom domain, so Google only sees a single set of URLs.

export const onRequest = async ({ request, next }) => {
  const url = new URL(request.url);

  // Catch the auto-generated *.pages.dev hostname (Cloudflare doesn't let you
  // disable it; canonical tags are not always enough to dedupe in Google).
  if (url.hostname.endsWith('.pages.dev')) {
    url.hostname = 'spacecat.academy';
    return Response.redirect(url.toString(), 301);
  }

  return next();
};
