# PROJECT ARCHITECTURE
## Dalil El Manzala & El Matariya Digital Directory

### Core Architecture
- Cloudflare Worker = backend/API and business logic
- Cloudflare D1 = primary relational database
- Cloudflare R2 = object/file/image storage
- Firebase Authentication = user authentication only
- Firebase Cloud Messaging (FCM) = push notifications only

Firebase Realtime Database is NOT the application's main database.

### Cloudflare Resources
D1 database: `dalilmanzala-db`
D1 database ID: `9e98b9d3-619f-4ef4-9af5-6458c2382251`
Known tables: `places`, `categories`, `reviews`, `users`, `_cf_KV`

R2 bucket: `elmanzala`

Worker: `elmanzala`
Production domain: `https://dalilmanzala.com`

### Database Responsibilities
Use D1 as the single source of truth for:
- places and place metadata
- categories and subcategories
- addresses, phones, WhatsApp and map links
- coordinates and descriptions
- logos and cover-image URLs
- owners and verification status
- offers/products/services metadata
- statistics and working hours
- reviews, ratings and comments
- all persistent directory/user-generated application data

Do NOT duplicate directory data into Firebase.

### Firebase Responsibilities
Firebase remains intentionally installed for only:

1. Firebase Authentication
   - user sign-in
   - user identity
   - authentication state
   - authenticated sessions

2. Firebase Cloud Messaging (FCM)
   - browser/mobile Push Notifications
   - notification delivery
   - device/browser messaging tokens

Firebase Realtime Database MUST NOT be used for places, reviews, comments, categories, statistics, images, or other directory data.
Firestore MUST NOT be introduced as a secondary database.

### Notification Strategy
FCM is a notification delivery service, NOT the directory database.
Do not store places, reviews, comments, categories, images, or directory records in Firebase merely to support notifications.
If notification/device tokens need persistence, store only the minimum required token/device metadata in D1 unless a specific Firebase service requirement makes another approach necessary.
The Worker may communicate with FCM to trigger push notifications.

### Performance / Cost Principles
Do NOT load the entire `places` table on every search or page load.
Use targeted D1 queries, pagination, appropriate indexes, and only the required columns.
Retrieve a single place by slug/ID when opening a place.
Retrieve reviews only when needed.
Keep large images/files in R2.
Avoid unnecessary repeated D1 queries.
Keep Firebase out of the main directory data path.

Goal: LOW D1 reads + LOW latency + HIGH scalability.

### Public Place URLs
Canonical sharing URLs use:
`https://dalilmanzala.com/p/{slug}`

Example:
`https://dalilmanzala.com/p/dktwr-by-sy-lkhdmat-alkmbywtr-walantrnt`

Normal visitors may be redirected to:
`https://dalilmanzala.com/place.html?slug={slug}`

For crawler HTML, `canonical` and `og:url` MUST point to `/p/{slug}`, never `/place.html`.

### Legacy Firebase Code
Some Firebase SDK code may remain because Auth and FCM are still required. Do not interpret Firebase SDK presence as permission to restore Firebase database usage.
Distinguish Auth/FCM code from obsolete Realtime Database code. Remove/replace only obsolete database operations while preserving Auth and FCM.

### Forbidden Changes
Unless explicitly requested by the project owner, do NOT:
- move D1 data to Firebase
- add Firestore
- restore Firebase Realtime Database
- store places/reviews/comments/images in Firebase
- make Firebase the source of truth
- replace D1 or R2
- bypass the Worker for sensitive server-side operations

### Required Procedure for Antigravity
Before every modification:
1. Inspect the current implementation.
2. Identify whether the feature belongs to Worker, D1, R2, Firebase Auth, FCM, or frontend.
3. Reuse the existing architecture.
4. Do not introduce a second database.
5. Do not rewrite working infrastructure unnecessarily.
6. Verify after changes that D1 remains the source of truth, R2 remains storage, Firebase Auth works, FCM works, no Firebase Realtime Database dependency was introduced, and `/p/{slug}` social sharing still works.

### Architectural Constraint
Treat this document as an architectural constraint. If a feature appears to require Firebase database storage, first evaluate whether it belongs in D1. Only use Firebase database services if the project owner explicitly requests that architecture change.

Default architecture:

D1 = application database
R2 = file/image storage
Worker = backend/API
Firebase Auth = authentication
FCM = push notifications
