# Blossom domain redirects

Both retired sites were removed from ServerPilot on 21 October 2026. Their redirects run independently of the old droplet. Changes in this repository do not deploy automatically.

## BlossomACT

DigitalOcean App Platform app `blossomact-redirect` (`5ef9fad7-2593-4d45-abed-83c23ed287c8`) returns HTTP 301 to `https://www.moreblossom.com/` for every path, preserving query strings. It has no serving components or PHP. The HTML file is an unused fallback reference.

Apply `.do/app.yaml` through App Platform. Apex and www are ordinary managed domains with automatic HTTPS; the temporary wildcard certificate configuration was removed after certificate activation. Both domains showed Active on the final provider readback.

DigitalOcean DNS has apex A records `162.159.140.98` and `172.66.0.96`, and www CNAME `blossomact-redirect-bmiyq.ondigitalocean.app`. Keep Google Workspace MX, SPF, DKIM, DMARC and existing Kit records intact. Mail does not depend on the web app.

## BlossomAnalysis

Cloudflare's free native redirects handle this domain: 9,384 Bulk Redirect entries in `blossomanalysis_legacy_redirects` and six Single Redirect rules for search, feed/pagination suffixes and retired WordPress endpoints. There are no active Worker routes and no Workers Paid subscription. The Worker source is retained only as the original mapping reference and rollback material.

The proxied apex uses reserved IP `192.0.2.1`, so redirects have no origin server dependency. Keep the DNS-only `api` analytics record and all mail DNS intact. HTTPS remains managed at Cloudflare.

`cloudflare/native-redirect-plan.json` is the deployed native configuration. `python cloudflare/build-native-redirects.py` rebuilds it from the historical mapping in `worker.mjs`. Configure the list and account `http_request_redirect` entrypoint with the list lookup scoped to this domain. Apply `singleRules` to the zone's `http_request_dynamic_redirect` entrypoint. Keep existing unrelated account and zone rules when updating either entrypoint.

Native rules retain all specific destinations and section fallbacks. Unknown paths redirect to the homepage. Two intentional simplifications remove the Worker entirely: retired WordPress endpoints now return a homepage 301 rather than 410; pagination suffixes accept any suffix after `/page/`, rather than digits only. No retired PHP endpoint executes. Query strings are preserved.

## Verification

Run `node cloudflare/test-native.mjs` and `node cloudflare/test-worker.mjs`. The former compares every specific mapping in both slash forms against the historical reference. Live migration checks covered 155 URLs, including all 44 encoded Unicode variants, search, sections, suffixes and unknown paths. Cloudflare API readback matched all 9,384 list entries after normalizing percent encoding.

Historical BlossomAnalysis accounting data is preserved separately on the old droplet; it is not deployed or exposed by this repository. Do not point web DNS back to the old WordPress host.
