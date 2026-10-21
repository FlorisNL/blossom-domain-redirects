# Blossom domain redirects

BlossomACT is retired. DigitalOcean App Platform redirects every request to https://www.moreblossom.com/ with HTTP 301. Its app has no serving components: only an ingress redirect, managed domains and HTTPS. Query strings are preserved. The optional static HTML is a fallback reference and is not deployed.

Keep Google Workspace MX, SPF, DKIM and DMARC records in DigitalOcean DNS. They are independent of the website.

BlossomAnalysis redirects are deployed separately as the `blossomanalysis-redirects` Cloudflare Worker, preserving the legacy path mapping. Routes cover `blossomanalysis.com/*` and `*.blossomanalysis.com/*`. The proxied apex uses reserved IP `192.0.2.1`, so there is no origin server dependency. Keep the `api` DNS-only record and all email records intact.

The Worker passed all 9,366 saved legacy path cases before activation. It never fetches an origin. WordPress endpoints return 410; other unknown paths redirect to the homepage. The Workers Free daily request allowance applies; exceeding it fails closed rather than exposing the retired server. Do not point either domain back to the retired WordPress droplet.
