# Blossom domain redirects

BlossomACT is retired. DigitalOcean App Platform redirects every request to https://www.moreblossom.com/ with HTTP 301. Its app has no serving components: only an ingress redirect, managed domains and HTTPS. Query strings are preserved. The optional static HTML is a fallback reference and is not deployed.

Status on 21 October 2026: the App Platform redirect is prepared, while public ACT web DNS remains on the old redirect host until its new certificate is verified. The current app spec requests an apex-plus-wildcard certificate through DNS TXT validation. Complete certificate verification before moving web DNS; after migration, prefer ordinary apex/www automatic certificate renewal over manual wildcard revalidation.

Keep Google Workspace MX, SPF, DKIM and DMARC records in DigitalOcean DNS. They are independent of the website.

BlossomAnalysis redirects are deployed separately as the `blossomanalysis-redirects` Cloudflare Worker, preserving the legacy path mapping. Routes cover `blossomanalysis.com/*` and `*.blossomanalysis.com/*`. The proxied apex uses reserved IP `192.0.2.1`, so there is no origin server dependency. Keep the `api` DNS-only record and all email records intact.

The Worker passed all 9,366 saved legacy path cases before activation. It never fetches an origin. WordPress endpoints return 410; other unknown paths redirect to the homepage. The Workers Free daily request allowance applies; exceeding it fails closed rather than exposing the retired server. Do not point either domain back to the retired WordPress droplet.

Run `node cloudflare/test-worker.mjs` for the focused routing checks. Changes in this repository do not automatically deploy either host; apply the relevant app spec or Worker through its provider and verify its public endpoint.
