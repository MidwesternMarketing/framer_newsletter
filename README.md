## Newsletter Signup Form for Framer

This package provides a custom React (Framer Code) component and serverless API handlers to submit signups to both Beehiiv (newsletter) and HubSpot (CRM) simultaneously.

### What you get

- `components/NewsletterSignup.tsx`: Framer-compatible React component with validation, accessibility, loading states, and detailed success/error feedback.
- `styles/NewsletterSignup.module.css`: Responsive form styles.
- `api/subscribe.js`: Single serverless endpoint to call both integrations in parallel.
- `api/handlers/beehiiv.js` and `api/handlers/hubspot.js`: API call helpers.
- `.env.example`: Environment variables required by the serverless API.

### High-level flow

1. User fills form in Framer component
2. Component submits to your deployed serverless endpoint `/api/subscribe`
3. Serverless calls Beehiiv and HubSpot in parallel
4. API responds with per-integration results for clear UX

### Why a serverless endpoint?

Beehiiv and HubSpot require secret keys/tokens. Framer Code components run in the browser, so secrets must not be exposed client-side. Deploy the provided serverless endpoint on your own infra (e.g., Vercel, Netlify, Cloudflare Workers), then configure the component to point to that base URL.

---

## Setup

### 1) Deploy the serverless API

Option A: Vercel

1. Move the `api/` folder to a new or existing Vercel project root.
2. In Vercel Project Settings → Environment Variables, set:
   - `BEEHIIV_API_KEY`
   - `BEEHIIV_PUBLICATION_ID`
   - `HUBSPOT_ACCESS_TOKEN`
3. Deploy. Your endpoint will be at: `https://<your-app>.vercel.app/api/subscribe`

Option B: Netlify

1. Convert the handlers in `api/` to Netlify functions (rename to `netlify/functions/subscribe.js` and export `handler`).
2. Configure env vars in Netlify.
3. Deploy. Your endpoint will be at: `/.netlify/functions/subscribe`

Option C: Cloudflare Workers

1. Wrap the logic from `api/subscribe.js` in a Worker `fetch()` handler.
2. Put secrets in Worker Secrets.
3. Deploy and use the public URL as your API base.

Note: Minimal, in-memory rate limiting is included for basic protection. For production, use a durable store (Upstash Redis, Cloudflare KV/D1, Vercel KV) and edge middleware.

### 2) Configure environment variables

Copy `.env.example` and set values in your deployment provider (do not commit `.env`):

```
BEEHIIV_API_KEY=your_beehiiv_api_key
BEEHIIV_PUBLICATION_ID=your_publication_id
HUBSPOT_ACCESS_TOKEN=your_hubspot_token
```

### 3) Add the component to Framer

1. In your Framer project, add a Code Component package (or import these files into your code component package).
2. Include `components/NewsletterSignup.tsx` and `styles/NewsletterSignup.module.css`.
3. Drag the `NewsletterSignup` component onto the canvas.
4. In component props, set `apiBaseUrl` to your deployed serverless base URL (e.g., `https://<your-app>.vercel.app`).

### 4) GDPR compliance

- A consent checkbox and explanatory text are included. It is required by default.
- The HubSpot request sets GDPR legal basis properties.
- Customize the text via component props.

### 5) Customization

Use Framer property controls to customize:

- Labels/placeholders
- Button text and success/error messages
- GDPR text and requirement toggle
- API base URL

### 6) Error handling

- Client-side validation for required fields and email format
- Server returns per-integration success/failure
- The component displays granular messages and allows retry

### 7) Rate limiting

Basic in-memory IP-based rate limiting prevents rapid repeated submissions. This is best-effort only in serverless environments. Replace with a Redis/KV-backed limiter for production.

---

## API Reference

POST `{API_BASE_URL}/api/subscribe`

Request JSON body:

```
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "companyName": "Acme Inc",
  "phoneNumber": "+1 555-0100",
  "consent": true
}
```

Response (200):

```
{
  "ok": true,
  "results": {
    "beehiiv": { "ok": true },
    "hubspot": { "ok": true }
  }
}
```

If one fails:

```
{
  "ok": false,
  "results": {
    "beehiiv": { "ok": true },
    "hubspot": { "ok": false, "status": 400, "message": "..." }
  }
}
```

---

## Notes

- Beehiiv endpoint used: `POST https://api.beehiiv.com/v2/publications/{PUBLICATION_ID}/subscriptions` with `X-Api-Key` header.
- HubSpot endpoint used: `POST https://api.hubapi.com/crm/v3/objects/contacts/batch/upsert?idProperty=email` with `Authorization: Bearer`.
- Do not expose secrets in Framer; always call your serverless API.


