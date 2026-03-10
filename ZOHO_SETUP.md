# Zoho CRM Setup Guide

Complete configuration for the EnergDive ↔ Zoho CRM integration, covering both the **Magic Link** portal access flow and **Website Signup** lead tracking.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  System A: Magic Link (Portal Access)                       │
│                                                             │
│  Zoho CRM: Create/Edit Lead (Portal_Access = Yes)           │
│       ↓ Workflow Rule triggers Deluge function               │
│  Deluge: POST /api/zoho/provision (JSON body)               │
│       ↓ Creates Clerk user, generates magic token            │
│  Brevo: Sends email with magic link                         │
│       ↓ User clicks link → /access?token=XXX                │
│  Next.js: Validates token → Clerk sign-in ticket → login    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  System B: Website Signup → Zoho Lead                       │
│                                                             │
│  User signs up on website → Clerk creates user              │
│       ↓ Clerk webhook fires (user.created)                  │
│  Webhook: Upserts a LEAD in Zoho CRM (never a Contact)     │
│       ↓ Lead record preserved for Magic Link flow           │
│  Onboarding: Updates same Lead with full profile data       │
└─────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> Website signups create **Leads** (not Contacts). This ensures that manually created Leads with `Portal_Access = Yes` are never destroyed by the Clerk webhook.

---

## 1. Leads Module — Custom Fields

Create these custom fields in the **Leads** module:

| Field Label     | API Name         | Type              | Description                          |
| :-------------- | :--------------- | :---------------- | :----------------------------------- |
| Portal Access   | `Portal_Access`  | Checkbox          | Triggers the Magic Link workflow     |
| Magic Token     | `Magic_Token`    | Single Line Text  | Stores the generated magic token     |
| Token Expiry    | `Token_Expiry`   | DateTime          | When the magic token expires         |
| Sub Industry    | `Sub_Industry`   | Single Line Text  | Secondary industry classification    |
| Community       | `Community`      | Multi Select      | User community groups                |
| Sub Community   | `Sub_Community`  | Multi Select      | Specific user community groups       |
| Query Type      | `Query_Type`     | Single Line Text  | Triggers specific views (EnergClub)  |

> **Note**: `Industry`, `Company`, `Phone`, `Designation`, `Email` are standard Lead fields. Verify API names match in **Setup > Developer Space > APIs > API Names**.

---

## 2. Workflow Rule

1. Go to **Setup > Automation > Workflow Rules**
2. Create a new rule for the **Leads** module
3. **When**: Create or Edit
4. **Condition**: `Portal_Access` is `true` AND `Email` is not empty
5. **Action**: Function → select the `portal_provision` Deluge function

---

## 3. Deluge Script (Custom Function)

The Deluge script is located at `zoho-deluge/provision-and-email.dg`.

**Key points:**
- The function receives `leadId` as an argument (mapped to Lead ID in the workflow)
- Payload is sent as **JSON** (not form-encoded)
- The `x-webhook-secret` header must match `ZOHO_WEBHOOK_SECRET` in your `.env`
- On success, it sends a styled HTML email with the magic link

> [!WARNING]
> Replace `my_super_secret_123` in the Deluge script with your actual `ZOHO_WEBHOOK_SECRET` value.

---

## 4. Environment Variables

```env
# Zoho CRM OAuth
ZOHO_CLIENT_ID=...
ZOHO_CLIENT_SECRET=...
ZOHO_REFRESH_TOKEN=...
ZOHO_API_DOMAIN=https://www.zohoapis.in

# Zoho Webhook Security
ZOHO_WEBHOOK_SECRET=...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
CLERK_WEBHOOK_SECRET=...

# App
NEXT_PUBLIC_APP_URL=https://www.energdive.com
```

---

## 5. End-to-End Flows

### Flow A: Magic Link Portal Access

1. Admin creates or edits a Lead in Zoho CRM, sets `Portal_Access = Yes`
2. Workflow rule fires the `portal_provision` Deluge function
3. Deluge calls `POST /api/zoho/provision` with Lead data as JSON
4. Provision endpoint:
   - Finds or creates a Clerk user
   - Generates a magic token (stored in DB)
   - Sends a Brevo email with the magic link
5. User clicks link → `/access?token=XXX`
6. Token is validated against DB → Clerk sign-in ticket issued → user is logged in

### Flow B: Website Signup

1. User signs up on the website → Clerk creates user
2. Clerk `user.created` webhook fires → `POST /api/webhooks/clerk`
3. Webhook handler:
   - Upserts user in local DB
   - Syncs to Brevo
   - **Upserts a Lead** in Zoho CRM (deduped by email) — never creates a Contact
4. User completes onboarding → `POST /api/onboarding/submit`
5. Onboarding handler:
   - Saves full profile to DB
   - **Updates the same Lead** in Zoho CRM with industry, community, etc.

---

## 6. API Endpoints

| Endpoint                    | Purpose                                      |
| :-------------------------- | :------------------------------------------- |
| `POST /api/zoho/provision`  | Called by Deluge to provision magic link user |
| `POST /api/zoho/create-lead`| Create/update a Lead from the website         |
| `POST /api/webhooks/clerk`  | Clerk webhook — upserts Lead in Zoho         |
| `POST /api/onboarding/submit` | Full profile save — updates Lead in Zoho   |
