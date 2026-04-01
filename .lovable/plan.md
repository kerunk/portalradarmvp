

## Bug Analysis

### Root Cause: Password Change Fails

The `changePassword` function (line 484) calls `getEffectiveCredential(email)` which checks:
1. `mvp_credentials` localStorage (saved credentials)
2. `DEFAULT_CREDENTIALS` hardcoded map

For newly created companies, neither exists. The temp password is only stored in the company object (`company.tempPassword`), not in the credentials store.

The login flow has a fallback (lines 366-403) that checks `company.tempPassword` directly, so login works. But `changePassword` has no such fallback -- it returns `false` immediately.

### Root Cause: White Screen

No `ErrorBoundary` exists in the app. When an error occurs (e.g., navigating back after failed state), React unmounts the entire tree with no recovery.

---

## Plan

### 1. Fix `changePassword` to support company temp passwords

**File: `src/contexts/AuthContext.tsx`**

In `changePassword` (line 484-488), add a fallback: if `getEffectiveCredential` returns null, check `company.tempPassword` from the companies list (same logic as login). If the current password matches the temp password, allow the change.

### 2. Save credentials at company creation time

**File: `src/components/companies/CreateCompanyDialog.tsx`**

After `addCompany(company)` (line 132), also save the temp password into `mvp_credentials` via a new exported helper. This ensures consistency -- credentials are always in one place.

**File: `src/contexts/AuthContext.tsx`**

Export `setCredential` function (or create a wrapper `registerCredential`) so CreateCompanyDialog can use it.

### 3. Add ErrorBoundary for white screen recovery

**New file: `src/components/ErrorBoundary.tsx`**

Create a class component that catches render errors and shows a recovery UI with a "Voltar ao Início" button instead of a blank screen.

**File: `src/App.tsx`**

Wrap the app content inside the ErrorBoundary.

### 4. Improve error messages in ChangePassword page

**File: `src/pages/ChangePassword.tsx`**

Add more specific error feedback when password change fails (already has generic message; keep as-is since the fix addresses the root cause).

---

## Technical Details

- `setCredential` will be exported from AuthContext.tsx as a standalone utility (it's already a pure function, not tied to React state)
- ErrorBoundary uses `componentDidCatch` + state to render fallback UI with navigation to `/login`
- No new dependencies needed

