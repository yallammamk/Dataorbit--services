# Security and Privacy Launch Checklist

This project is a static website. The browser-side form currently validates input only; it has no submission endpoint and sends or stores no form data. Its submit control stays disabled until the local script initializes, and the form has no native POST action, so disabling or failing JavaScript does not send entered values. Browser markup is not a substitute for server-side security controls.

## Before enabling the form

- Configure a trusted HTTPS form endpoint. Keep API keys and credentials on the server; never put secrets in `script.js` or HTML.
- Allow only the exact endpoint origin in the Content Security Policy `connect-src` response header and in the HTML policy. Avoid wildcard origins. Configure appropriate CORS rules at the endpoint.
- Validate and constrain every submitted field on the server. Treat all browser data as untrusted, use parameterized database operations, encode output, enforce request-size limits, and reject unexpected fields.
- Add rate limiting and abuse/spam controls. Use CSRF protection if the submission workflow relies on cookies or authenticated sessions.
- Use TLS, restrict access to submitted enquiries, avoid putting personal data in URLs or routine logs, define retention and deletion periods, and document the form/hosting providers and any international transfers.
- Add an operational consent and opt-out workflow. The checkbox on this demo is not recorded and does not itself establish a lawful basis for outreach.

## Configure HTTP response headers at the host

Set headers at the web host, CDN, or reverse proxy. Meta tags cannot replace all response headers, notably `frame-ancestors` and HSTS. A starting point for a site using only same-origin assets is:

```text
Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; frame-src 'none'; img-src 'self' data:; style-src 'self'; font-src 'self'; script-src 'self'; connect-src 'self'; form-action 'none'; upgrade-insecure-requests
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
Strict-Transport-Security: max-age=31536000
```

Only enable HSTS after HTTPS is correctly deployed. Add `includeSubDomains` only when every subdomain supports HTTPS. When using a separate form origin, explicitly add its HTTPS origin to `connect-src`, set narrow CORS rules there, and verify the resulting policy in the browser. Keep the HTML CSP and hosting CSP aligned.

GitHub Pages does not provide repository-controlled arbitrary HTTP response headers. A `_headers` file alone does not configure headers on GitHub Pages. To add response-header protections such as `frame-ancestors`, `X-Content-Type-Options`, and `Permissions-Policy`, configure a supported CDN/reverse proxy or use a host that supports custom headers, then verify the headers on the deployed HTTPS responses. The current HTML CSP is a useful additional restriction, but it does not replace those response headers.

## Protect the source and deployment

The GitHub repository is public, so everything committed to it is publicly readable, including its history. Never commit passwords, API keys, private customer data, or confidential datasets. Use a unique password and a passkey or two-factor authentication on the GitHub account and domain/DNS provider; keep recovery codes somewhere private and offline.

In the repository’s GitHub settings, protect `main`: require pull requests, require approval from a different trusted account, dismiss stale approvals, and block force-pushes and branch deletion. Do not allow administrators to bypass these rules unless there is a documented emergency process. A sole maintainer cannot approve their own pull request; arrange a trusted reviewer before requiring approvals. Review repository collaborators, GitHub Actions permissions, Pages publishing settings, and domain/DNS access periodically. Branch rules must be enabled in GitHub settings; a file in this repository cannot enforce them.

## Privacy and data-use review

- Complete the bracketed fields in `privacy.html` and `terms.html`; these are review drafts, not legal advice or final policies. Have counsel review the actual operating entity, locations, data sources, purposes, legal basis, providers, retention, rights handling, and governing terms.
- Document the source and collection method for each business database. Public availability alone does not automatically authorize every collection, disclosure, or marketing use.
- Review privacy and direct-marketing requirements for every target region, including applicable opt-out, suppression, consent, notice, and recordkeeping obligations.
- Remove the visible draft warning and `noindex` directive only after the policy pages are complete, approved, and actually reflect implemented practices.
- Re-review this checklist whenever a form endpoint, analytics tool, cookie, external asset, or data processor is added.
