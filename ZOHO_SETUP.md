# Zoho CRM Setup Guide

To enable the magic link authentication flow, you need to configure Zoho CRM with custom fields and a workflow rule that triggers a custom function.

## 1. Custom Fields
Create the following custom fields in the **Leads** module:

| Field Label | API Name (Check API Names section) | Type | Description |
| :--- | :--- | :--- | :--- |
| Magic Token | `Magic_Token` | Single Line Text | Stores the generated UUID. |
| Token Expiry | `Token_Expiry` | DateTime | Stores when the token expires. |

> **Note**: Ensure the API Names match exactly what is used in `lib/zoho.ts`. You can verify this in **Setup > Developer Space > APIs > API Names**.

## 2. Workflow Rule
1.  Go to **Setup > Automation > Workflow Rules**.
2.  Create a new rule for **Leads**.
3.  **When**: "Create" (or "Create / Edit" if you want to allow re-sending).
4.  **Condition**: "Email is not empty" (and any other criteria like "Lead Source is Web").
5.  **Action**: "Function" -> "New Function" -> "Write your own".

## 3. Deluge Script (Custom Function)
Paste the following code into the Deluge editor:

```javascript
// Inputs: leadId (Argument mapped to Lead Id), leadEmail (Argument mapped to Email)

// 1. Generate Token and Expiry
token = uuid(); // Zoho has a built-in uuid function? If not, use random number or simple hash
// If UUID not available:
token = (now.toLong() + leadId).toString().md5(); 

// Set expiry to 10 minutes from now
expiry = now.addMinutes(10).toString("yyyy-MM-dd'T'HH:mm:ss+00:00");

// 2. Update Lead Record
mp = Map();
mp.put("Magic_Token", token);
mp.put("Token_Expiry", expiry);
update = zoho.crm.updateRecord("Leads", leadId, mp);

// 3. Construct URL
// REPLACE with your actual domain
baseUrl = "https://your-domain.com";
authUrl = baseUrl + "/api/auth/invite?email=" + zoho.encryption.urlEncode(leadEmail) + "&token=" + token;

// 4. Send Email
sendmail
[
    from: zoho.adminuserid,
    to: leadEmail,
    subject: "Welcome to EnergDive! Access your Dashboard",
    message: "Click here to login: <a href='" + authUrl + "'>Access Dashboard</a> (Valid for 10 mins)",
    content_type: "html"
]
```

## 4. Environment Variables (Next.js)
Ensure your `.env` file has the following credentials to allow Next.js to validate the token:

```env
ZOHO_CLIENT_ID=...
ZOHO_CLIENT_SECRET=...
ZOHO_REFRESH_TOKEN=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
```

## 5. Contacts Module Setup

Create the following custom fields in the **Contacts** module for website registration sync:

| Field Label | API Name | Type | Description |
| :--- | :--- | :--- | :--- |
| Sub Industry | `Sub_Industry` | Single Line Text | Secondary industry classification |
| Community | `Community` | Single Line Text | User community group |
| Sub Community | `Sub_Community` | Single Line Text | Specific user community group |
| Query Type | `Query_Type` | Single Line Text | Triggers specific views (e.g. EnergClub) |

Note: `Industry` and `Company` are usually built-in standard fields, but `Sub_Industry`, `Community`, `Sub_Community`, and `Query_Type` will need to be created as custom fields if they don't already exist.
