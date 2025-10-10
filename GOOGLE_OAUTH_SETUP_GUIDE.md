# 🔧 Google OAuth Setup Guide for Ringmaster Roundtable

## Current Issue
Error 403: access_denied when trying to sync calendar - this happens because the OAuth app needs proper configuration.

## Step-by-Step Fix

### 1. OAuth Consent Screen Configuration
Visit: https://console.cloud.google.com/apis/credentials/consent

**Required Settings:**
- **User Type**: Choose "External" (for public use) or "Internal" (for Google Workspace users only)
- **App Name**: "Ringmaster Roundtable"
- **User Support Email**: Your email (tanishqgupta2710@gmail.com)
- **Developer Contact**: Your email (tanishqgupta2710@gmail.com)

### 2. Scopes Configuration
Add these scopes:
- `https://www.googleapis.com/auth/calendar` (Calendar access)
- `https://www.googleapis.com/auth/userinfo.email` (Email access)
- `https://www.googleapis.com/auth/userinfo.profile` (Profile access)

### 3. Test Users (if using External + Testing mode)
Add your email as a test user:
- Email: tanishqgupta2710@gmail.com

### 4. Domain Configuration (Important!)
In the "Authorized domains" section, add:
- `localhost` (for development)
- If you have a production domain, add it here too

### 5. OAuth Client Configuration
Visit: https://console.cloud.google.com/apis/credentials

**For your existing OAuth Client (280397440767-p679m9veiuv6m8a4t1vsoolmlvev06ar.apps.googleusercontent.com):**

**Authorized JavaScript origins:**
- `http://localhost:5173`
- `http://localhost:3000`
- `https://localhost:5173`

**Authorized redirect URIs:**
- `http://localhost:5173`
- `storagerelay://http/localhost:5173`

### 6. Enable Required APIs
Make sure these APIs are enabled:
- Google Calendar API
- Google+ API (for user info)

Visit: https://console.cloud.google.com/apis/library

### 7. Publishing Status
**For Development/Testing:**
- Keep status as "Testing" and add yourself as test user

**For Production:**
- Change status to "In production" after verification

## Quick Checklist ✅
- [ ] OAuth consent screen configured
- [ ] App name set to "Ringmaster Roundtable"
- [ ] Calendar scope added
- [ ] Test user added (your email)
- [ ] Authorized domains configured
- [ ] JavaScript origins configured
- [ ] Redirect URIs configured
- [ ] Google Calendar API enabled

## After Configuration
1. Save all changes in Google Cloud Console
2. Wait 5-10 minutes for propagation
3. Clear browser cache/cookies for Google accounts
4. Try the calendar sync again

## Troubleshooting
If you still get errors:
1. Double-check all URLs match exactly
2. Ensure your email is added as test user
3. Try incognito/private browsing mode
4. Check if APIs are enabled and billing is set up (if required)

---
Current OAuth Client ID: 280397440767-p679m9veiuv6m8a4t1vsoolmlvev06ar.apps.googleusercontent.com