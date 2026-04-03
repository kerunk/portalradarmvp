

## Auto-Recovery for White Screen — Plan

### What it does
Adds a lightweight watchdog that detects when the app fails to render (white screen) and shows a recovery UI with options to return to `/login` or clear corrupted data.

### Why it won't break anything
- It's a **standalone wrapper** around the existing `<App />` in `index.html` / `main.tsx`
- Zero changes to any existing component, page, route, auth logic, or storage
- It only activates if React fails to mount or crashes completely — normal operation is untouched

### Implementation (2 files, minimal changes)

**1. `index.html`** — Add inline fallback UI + timeout watchdog

- Add a `<div id="app-fallback">` with a hidden recovery screen (pure HTML/CSS, no React)
- Add a small inline `<script>` that:
  - Waits 6 seconds after page load
  - Checks if `#root` has any rendered children
  - If empty → shows the fallback div with two buttons:
    - "Voltar para login" → clears `mvp_auth_session` from localStorage, navigates to `/login`
    - "Limpar dados e recarregar" → clears all `mvp_*` keys, reloads

**2. `src/main.tsx`** — Hide fallback after successful render

- After `createRoot(...).render(<App />)`, add a line to hide the fallback div (confirms React mounted successfully)

### No other files touched
- No changes to ErrorBoundary, AuthContext, routes, pages, storage, components, or any business logic
- The fallback is pure HTML that exists outside React — it's a safety net only

