# E-book Distribution & Reader Hub Extension for SBCMS

A digital book fulfillment and distribution extension for SBCMS.

## Features
- **Multi-Format Digital Assets**: Upload and manage EPUB, Kindle (MOBI/AZW3), and PDF files for each product in your store.
- **Secure Download Tokens**: Time-limited and download-capped distribution URLs generated automatically upon store checkout.
- **Free Review Copies**: Send complimentary copies directly from the admin dashboard with personalized author notes dispatched via transactional email (Postmark).
- **Offline Handout Cards**: Generate batches of single-use alphanumeric card codes (e.g. `READ-K92X-A3F8`) that readers can redeem at `/redeem`.
- **Customer Reader Hub**: Reader-friendly download portal with detailed instructions for syncing to Apple Books, Kindle, Kobo, and Android.

## Manifest Configuration
Declared in `manifest.json`:
- `id`: `ebook-distribution`
- `permissions`:
  - `storage:upload`: Store and deliver digital ebook assets.
  - `store:orders:read`: Automate fulfillment for digital book purchases.
  - `email:send`: Dispatch review copy notifications.
  - `routes:public`: Serve the `/download/:token` and `/redeem` customer interfaces.
