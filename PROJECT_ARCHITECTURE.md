# PROJECT ARCHITECTURE — دليل المنزلة والمطرية الرقمي

## 1. Purpose

This document describes the CURRENT production architecture of the project after migrating the backend away from Firebase.

This architecture is intentional and must be preserved during future development.

The current production stack is:

- GitHub Pages — frontend/static hosting
- Cloudflare Workers — backend/server-side logic
- Cloudflare D1 — authoritative database
- Cloudflare R2 — authoritative image/file storage
- Custom domain — `https://dalilmanzala.com`

The existing production code is the source of truth.

Do not restore the old Firebase architecture unless explicitly requested.

---

## 2. Project

Project name:

**دليل المنزلة والمطرية الرقمي**

Main domain:

`https://dalilmanzala.com`

The project is a digital local directory for:

- المنزلة
- المطرية
- محافظة الدقهلية
- Businesses
- Shops
- Services
- Doctors
- Pharmacies
- Companies
- Professionals
- Local places

The project is a web application and PWA.

---

## 3. Current Production Architecture

```text
GitHub Pages
     |
     v
Cloudflare Worker
     |
     +---- Cloudflare D1
     |
     +---- Cloudflare R2
     |
     +---- External APIs only when explicitly required
```

### Frontend

Hosted through GitHub Pages.

### Backend

Cloudflare Worker.

### Database

Cloudflare D1.

### Storage

Cloudflare R2.

### Domain

`https://dalilmanzala.com`

---

## 4. Cloudflare Worker

Worker name:

`elmanzala`

Worker URL:

`https://elmanzala.nonm1724.workers.dev`

The Worker is responsible for backend/server-side functionality including:

- Routing
- Dynamic place/share URLs
- SEO HTML generation
- Open Graph metadata
- Facebook crawler handling
- Social-media crawler handling
- Redirecting normal visitors
- Database/API operations
- D1 access
- R2 access
- Other backend logic already implemented in `worker/index.js`

The Worker has been successfully deployed.

A recent deployment produced version:

`209a108f-c2e7-467c-a001-6ea5a82ad500`

The version ID may change after future deployments. The Worker name and architecture are the important references.

---

## 5. Cloudflare D1

Current D1 database:

`dalilmanzala-db`

Binding:

`env.DB`

D1 is the AUTHORITATIVE DATABASE for application data.

All new database functionality should use D1 unless an architectural change is explicitly approved.

Do NOT introduce:

- Firestore
- Firebase Realtime Database
- Another database service

Before changing database functionality:

1. Inspect the current D1 schema.
2. Inspect existing tables.
3. Inspect existing columns.
4. Reuse existing structures when appropriate.
5. Avoid duplicate data.
6. Minimize unnecessary reads/writes.
7. Preserve existing records.

Never delete or rename production tables/columns without explicit approval.

---

## 6. Cloudflare R2

Current R2 bucket:

`elmanzala`

Binding:

`env.elmanzala`

R2 is the AUTHORITATIVE storage system for:

- Images
- Uploaded files
- Place images
- Other application assets already stored there

Do NOT introduce Firebase Storage.

Do NOT migrate existing R2 files to another storage provider.

Do NOT create duplicate storage systems.

Before changing image/file functionality:

1. Inspect the existing R2 implementation.
2. Reuse existing R2 logic.
3. Preserve existing image URLs/references.
4. Avoid unnecessary duplicate uploads.

Never delete existing R2 files automatically.

---

## 7. Cloudflare Environment Variable

The Worker currently has:

`env.OPENROUTER_API_KEY`

Environment variable:

`OPENROUTER_API_KEY`

This is configured in Cloudflare.

Never expose this secret in:

- HTML
- Frontend JavaScript
- GitHub Pages
- Public JSON
- Client-side source code

Do not hard-code secrets into public files.

---

## 8. Firebase Migration

The project was originally created/implemented using Firebase components.

The backend architecture has now been migrated to:

**Cloudflare Worker + Cloudflare D1 + Cloudflare R2**

Firebase is NOT the current backend architecture.

A search of the current Worker file:

`worker/index.js`

for:

- `firebase`
- `firestore`
- `firebaseio`
- `initializeApp`
- `database(`

returned NO MATCHES.

Old Firebase references, SDK imports, configuration files, or historical code may still exist elsewhere in the project.

Their presence does NOT mean Firebase should be restored.

Before removing any remaining Firebase-related files, inspect whether they are actually referenced by the current frontend.

---

## 9. Firebase Must Not Be Reintroduced

Unless the developer/user explicitly says:

> Use Firebase for this feature.

Do NOT:

- Add Firebase SDKs
- Add Firestore
- Add Firebase Realtime Database
- Add Firebase Storage
- Add Firebase Authentication
- Move D1 data to Firestore
- Move R2 files to Firebase Storage
- Restore Firebase configuration
- Create Firebase backend endpoints

If a new feature can be implemented using:

**Cloudflare Worker + D1 + R2**

then it MUST be implemented using that architecture.

---

## 10. SEO Share URL Architecture

The project uses a special public sharing URL:

`https://dalilmanzala.com/p/{slug}`

Example:

`https://dalilmanzala.com/p/dktwr-by-sy-lkhdmat-alkmbywtr-walantrnt`

This URL is extremely important.

It is:

- The public share URL
- The canonical URL
- The URL intended for social sharing

It is used when sharing places on:

- Facebook
- WhatsApp
- Messenger
- X/Twitter
- LinkedIn
- Other platforms

DO NOT change the canonical share URL to `/place.html`.

---

## 11. How `/p/{slug}` Works

When a request arrives at:

`/p/{slug}`

the Cloudflare Worker obtains the place data and generates server-side HTML.

The generated HTML contains relevant SEO/Open Graph metadata including:

- `<title>`
- `<meta name="description">`
- `<link rel="canonical">`
- `og:url`
- `og:title`
- `og:description`
- `og:image`
- Twitter metadata

This is SERVER-GENERATED HTML.

Do NOT convert this into client-side-only metadata.

Social crawlers must receive the metadata directly in the HTTP response.

---

## 12. Canonical and Open Graph URL

The Worker uses logic equivalent to:

```js
<link rel="canonical"
      href="${escapeHtml(shareUrl)}">

<meta property="og:url"
      content="${escapeHtml(shareUrl)}">
```

`shareUrl` represents:

`https://dalilmanzala.com/p/{slug}`

For example:

```text
https://dalilmanzala.com/p/dktwr-by-sy-lkhdmat-alkmbywtr-walantrnt
```

must appear as the canonical URL and `og:url`.

Do NOT replace these with:

```text
https://dalilmanzala.com/place.html?slug=...
```

---

## 13. Normal Visitor Redirect

The actual interactive place page is:

`/place.html?slug={slug}`

For normal human visitors, the Worker redirects:

`/p/{slug}`

to:

`/place.html?slug={slug}`

The current destination URL logic is equivalent to:

```js
const destinationUrl =
  `${canonicalBase}/place.html?slug=${encodeURIComponent(placeTargetSlug)}`;
```

Normal visitors receive HTTP 302.

Equivalent logic:

```js
if (!isCrawler) {
  return Response.redirect(destinationUrl, 302);
}
```

This behavior is intentional.

Do NOT remove or redesign it unless explicitly requested.

---

## 14. Crawler Detection

The Worker detects major crawlers using logic equivalent to:

```js
const userAgent = request.headers.get('user-agent') || '';

const isCrawler =
  /facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|telegrambot|googlebot|bingbot|slackbot|discordbot/i.test(userAgent);
```

Crawler requests do NOT receive the 302 redirect.

Instead, they receive HTTP 200 with server-generated SEO/Open Graph HTML.

This allows social platforms and search engines to read:

- title
- description
- image
- canonical URL
- `og:url`

before client-side navigation occurs.

Do NOT remove crawler handling.

---

## 15. Verified Crawler Behavior

The following test was performed:

```powershell
curl.exe -i -A "facebookexternalhit/1.1" "https://dalilmanzala.com/p/dktwr-by-sy-lkhdmat-alkmbywtr-walantrnt"
```

Result:

```text
HTTP/1.1 200 OK
```

The response contained:

```html
<link rel="canonical"
      href="https://dalilmanzala.com/p/dktwr-by-sy-lkhdmat-alkmbywtr-walantrnt">

<meta property="og:url"
      content="https://dalilmanzala.com/p/dktwr-by-sy-lkhdmat-alkmbywtr-walantrnt">
```

and also included:

- `og:title`
- `og:description`
- `og:image`
- Twitter metadata

This confirms that the crawler branch is working.

---

## 16. Verified Normal Visitor Behavior

The following test was performed:

```powershell
curl.exe -i "https://dalilmanzala.com/p/dktwr-by-sy-lkhdmat-alkmbywtr-walantrnt"
```

Result:

```text
HTTP/1.1 302 Found
```

with:

```text
Location:
https://dalilmanzala.com/place.html?slug=dktwr-by-sy-lkhdmat-alkmbywtr-walantrnt
```

This confirms that normal visitors are redirected correctly.

---

## 17. HTTP Response Headers

The Worker currently returns headers including:

```text
Content-Type: text/html; charset=utf-8
Cache-Control: no-store, no-cache, must-revalidate
X-Content-Type-Options: nosniff
```

Be careful when modifying the headers object.

For example, this is INVALID JavaScript:

```js
'Cache-Control': 'no-store, no-cache, must-revalidate'

'X-Content-Type-Options': 'nosniff'
```

A comma is required:

```js
'Cache-Control': 'no-store, no-cache, must-revalidate',

'X-Content-Type-Options': 'nosniff'
```

Do not accidentally reintroduce this syntax error.

---

## 18. Frontend Architecture

The frontend is hosted through GitHub Pages.

The actual interactive place page is:

`place.html`

The frontend communicates with the Cloudflare Worker when backend functionality is required.

Backend/database/storage operations should remain server-side.

Do not expose D1 administrative credentials or R2 administrative credentials to frontend code.

---

## 19. Performance Objective

The project is designed to minimize:

- D1 reads
- D1 writes
- R2 requests
- API requests
- Unnecessary network traffic

while keeping the user experience very fast.

When implementing new features:

- Reuse already-loaded data.
- Avoid duplicate queries.
- Avoid repeated API calls.
- Use efficient D1 queries.
- Cache where appropriate.
- Avoid unnecessary database writes.
- Do not add a new backend service just because it is convenient.

The main objective is:

**FAST RESPONSE + LOW DATABASE USAGE + LOW STORAGE USAGE + LOW COST**

---

## 20. Do Not Rewrite Working Code

This is one of the most important rules.

When a new feature is requested:

DO NOT rewrite the entire project.

DO NOT replace `worker/index.js` with a new implementation.

DO NOT replace the Worker architecture.

DO NOT replace D1.

DO NOT replace R2.

DO NOT replace the SEO system.

DO NOT replace crawler detection.

DO NOT replace the `/p/{slug}` architecture.

DO NOT remove existing features that are unrelated to the requested change.

Instead:

1. Inspect the current implementation.
2. Identify the exact file/function responsible.
3. Make the smallest required change.
4. Preserve everything else.
5. Test the affected functionality.
6. Verify that existing functionality still works.

---

## 21. Before Every Future Code Change

Before modifying code, determine:

1. Which file currently implements the feature?
2. Does it use D1?
3. Does it use R2?
4. Does it use the Worker?
5. Does it affect GitHub Pages?
6. Does it affect `/p/{slug}`?
7. Does it affect SEO/Open Graph?
8. Does it affect crawler behavior?
9. Does it affect existing database records?
10. Can the change be made without changing the architecture?

If the answer to #10 is YES:

Make the change without architectural changes.

If the answer is NO:

STOP and explain:

1. Why the current architecture cannot support the requested change.
2. What would need to change.
3. What existing functionality could be affected.

Do not make an architectural change automatically.

---

## 22. Database Safety

Never delete or rename an existing D1 table or column without explicit approval.

Never delete production data.

Never perform destructive migrations automatically.

Before modifying the database:

- Inspect schema.
- Inspect existing queries.
- Understand relationships.
- Preserve backward compatibility when possible.

---

## 23. Storage Safety

Never delete existing R2 files automatically.

Never change existing image URLs unnecessarily.

Never migrate R2 to another provider.

Never introduce Firebase Storage.

---

## 24. Secret and Security Rules

Never expose:

`OPENROUTER_API_KEY`

or any other server secret in:

- HTML
- frontend JavaScript
- GitHub Pages
- public JSON
- client-side source code

Secrets must remain server-side in Cloudflare Worker environment variables.

---

## 25. Project Source of Truth

The CURRENT files in the project are the source of truth.

Do NOT use an older Firebase-based version as the starting point for future work.

Do NOT restore deleted code simply because it existed in an older version.

If there is a conflict between the old architecture and the current production architecture:

**ALWAYS preserve the current production architecture.**

---

## 26. If Old Firebase Code Is Found

Do NOT immediately restore it.

First determine:

- Is it imported?
- Is it executed?
- Is it referenced by the current frontend?
- Is it required by any current feature?
- Is it only historical/unused code?

If unused:

Do not reintroduce it.

If uncertain:

Tell the user before making a change.

---

## 27. Current Architecture Summary

| Component | Current implementation |
|---|---|
| Frontend | GitHub Pages |
| Backend | Cloudflare Worker |
| Worker | `elmanzala` |
| Worker URL | `https://elmanzala.nonm1724.workers.dev` |
| Database | Cloudflare D1 |
| D1 database | `dalilmanzala-db` |
| D1 binding | `env.DB` |
| Storage | Cloudflare R2 |
| R2 bucket | `elmanzala` |
| R2 binding | `env.elmanzala` |
| AI/API secret | `OPENROUTER_API_KEY` |
| Main domain | `https://dalilmanzala.com` |
| Public share URL | `https://dalilmanzala.com/p/{slug}` |
| Actual interactive page | `https://dalilmanzala.com/place.html?slug={slug}` |
| Crawler behavior | HTTP 200 + server-rendered SEO/OG HTML |
| Normal visitor behavior | HTTP 302 -> `place.html?slug={slug}` |
| Firebase | NOT the current backend architecture |

---

## 28. Final Architecture Lock

Treat this architecture as LOCKED:

```text
GitHub Pages
      |
      v
Cloudflare Worker
      |
      +---- Cloudflare D1
      |
      +---- Cloudflare R2
```

Do not change this architecture unless the user explicitly authorizes an architectural change.

Every future feature should extend the existing system.

Priority order:

1. Preserve existing functionality.
2. Preserve existing data.
3. Preserve existing SEO.
4. Preserve existing share URLs.
5. Preserve D1.
6. Preserve R2.
7. Preserve Worker routing.
8. Preserve crawler handling.
9. Minimize database usage.
10. Make only the necessary code changes.

END OF PROJECT ARCHITECTURE DOCUMENT
