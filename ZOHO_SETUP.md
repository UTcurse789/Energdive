# Zoho CRM Setup Guide

Complete configuration for the EnergDive ↔ Zoho CRM integration, covering the **Magic Link** portal access flow, **Website Signup** lead tracking, and the **redesigned lead sync pipeline**.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  System A: Zoho Form → Portal (Redesigned Pipeline)         │
│                                                             │
│  Zoho Form Submission                                       │
│       ↓ Workflow Rule triggers Deluge function               │
│  Deluge: POST /api/leads/zoho-webhook (enriched JSON body)  │
│       ↓ Stores in DB pending_verifications (NO CRM push)    │
│  Brevo: Sends magic link email                              │
│       ↓ User clicks link → /verify-account?token=XXX        │
│  OTP verification → User record created (sync_status=pending)│
│       ↓ User completes onboarding                           │
│  Onboarding: Full profile saved to DB                       │
│       ↓ Sync Orchestrator runs                              │
│  Step 1: Brevo sync (enriched) → sync_status=brevo_synced   │
│  Step 2: CRM sync (enriched)   → sync_status=complete       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  System B: Magic Link (Portal Access)                       │
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
│  System C: Website Signup → Onboarding → Sync               │
│                                                             │
│  User signs up on website → Clerk creates user              │
│       ↓ Clerk webhook fires (user.created)                  │
│  Webhook: Upserts user in DB                                │
│       ↓ User completes onboarding                           │
│  Onboarding: Saves profile → Brevo sync → CRM sync         │
└─────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> Zoho Form leads are stored in the **database first**. No CRM or Brevo push happens until the user completes onboarding. This ensures ALL contacts in Brevo and CRM have complete, enriched data.

---

## Sync Status Lifecycle

| Status | Meaning |
|:--|:--|
| `pending` | User created but not yet synced externally |
| `brevo_synced` | Successfully synced to Brevo, CRM pending |
| `crm_synced` | Successfully synced to CRM |
| `complete` | All syncs done |
| `error` | Sync failed, can be retried |

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

## 2. Workflow Rules

### Rule A: Portal Access (Magic Link)
1. Go to **Setup > Automation > Workflow Rules**
2. Create a new rule for the **Leads** module
3. **When**: Create or Edit
4. **Condition**: `Portal_Access` is `true` AND `Email` is not empty
5. **Action**: Function → select the `portal_provision` Deluge function

### Rule B: Zoho Form Lead (Webhook to Portal)
1. Create a new rule for the **Leads** module
2. **When**: On Create
3. **Condition**: `Lead_Source` is `Zoho Form`
4. **Action**: Function → select the `form_lead_webhook` Deluge function

> [!CAUTION]
> **Disable native Zoho Form → CRM push.** If Zoho Forms has a built-in "Create Lead" action, it must be turned off. Only the Deluge webhook should fire.

---

## 3. Deluge Scripts (Custom Functions)

| Script | Location | Purpose |
|:--|:--|:--|
| `portal_provision` | `zoho-deluge/provision-and-email.dg` | Provision magic link for Portal Access |
| `form_lead_webhook` | `zoho-deluge/form-lead-webhook.dg` | Send Zoho Form data to Portal webhook |

**Key points for `form_lead_webhook`:**
- Sends enriched payload including `job_title`, `industry`, `community_portal`, `city`, `country`
- Calls `POST /api/leads/zoho-webhook` (not CRM)
- The `x-webhook-secret` header must match `ZOHO_FORM_WEBHOOK_SECRET` in your `.env`

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
ZOHO_FORM_WEBHOOK_SECRET=...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
CLERK_WEBHOOK_SECRET=...

# Brevo
BREVO_API_KEY=...

# App
NEXT_PUBLIC_APP_URL=https://www.energdive.com
```

---

## 5. End-to-End Flows

### Flow A: Zoho Form → Portal → Brevo → CRM (Redesigned)

1. User submits Zoho Form
2. Workflow rule fires the `form_lead_webhook` Deluge function
3. Deluge calls `POST /api/leads/zoho-webhook` with ALL lead data
4. Webhook handler:
   - Stores lead in `pending_verifications` (with enrichment fields)
   - Sends magic link email via Brevo
   - **Does NOT push to CRM**
5. User clicks magic link → OTP verification
6. `confirm-otp` handler:
   - Creates user in DB with enrichment data
   - Assigns membership_id
   - Sends welcome email
   - **Does NOT push to Brevo or CRM**
7. User completes onboarding → `POST /api/onboarding/submit`
8. Sync Orchestrator runs:
   - **Step 1**: Syncs enriched contact to Brevo (all fields)
   - **Step 2**: Only after Brevo succeeds, syncs to Zoho CRM
   - Updates `sync_status` at each stage

### Flow B: Magic Link Portal Access

1. Admin creates or edits a Lead in Zoho CRM, sets `Portal_Access = Yes`
2. Workflow rule fires the `portal_provision` Deluge function
3. Deluge calls `POST /api/zoho/provision` with Lead data as JSON
4. Provision endpoint creates Clerk user + magic token + Brevo email
5. User clicks link → login

### Flow C: Website Signup

1. User signs up on the website → Clerk creates user
2. Clerk `user.created` webhook fires → DB user created
3. User completes onboarding → Sync Orchestrator runs (Brevo → CRM)

---

## 6. API Endpoints

| Endpoint                              | Purpose                                      |
| :------------------------------------ | :------------------------------------------- |
| `POST /api/zoho/provision`            | Called by Deluge to provision magic link user |
| `POST /api/leads/zoho-webhook`        | Zoho Form webhook → store in DB, send magic link |
| `GET  /api/auth/verify-account`       | Validate magic token, send OTP               |
| `POST /api/auth/confirm-otp`          | Verify OTP, create user (no external sync)   |
| `POST /api/onboarding/submit`         | Full profile save → Brevo → CRM sync         |
| `POST /api/admin/retry-stuck-syncs`   | Retry failed/stuck syncs (cron/manual)       |

---

## 7. Key Files

| File | Purpose |
|:--|:--|
| `lib/lead-sync-orchestrator.ts` | Sequential Brevo → CRM sync with status tracking |
| `lib/magic-link-db.ts` | Magic link creation with enrichment field storage |
| `lib/brevoSync.ts` | Brevo contact sync (full + verified variants) |
| `lib/zoho-leads.ts` | Zoho CRM lead upsert/create with community parsing |
| `lib/job-queue.ts` | In-process background job queue |
| `migrations/011_enriched_pending_verifications.sql` | Schema for enrichment + sync tracking |
