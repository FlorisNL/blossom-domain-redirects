# Blossom domain redirects

BlossomACT is retired. DigitalOcean App Platform redirects every request to https://www.moreblossom.com/ with HTTP 301. The static file is a deployment component; the redirect runs at ingress before static content is served.

Keep Google Workspace MX, SPF, DKIM and DMARC records in DigitalOcean DNS. They are independent of the website.

BlossomAnalysis redirects are deployed separately in Cloudflare Workers, preserving the legacy path mapping. Do not point either domain back to the retired WordPress droplet.
