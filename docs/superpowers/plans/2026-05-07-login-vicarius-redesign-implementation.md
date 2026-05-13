# Login Vicarius Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/login` into a dark, `vicarius.io`-inspired hero page while preserving the current Chinese learning-product copy, login behavior, and route flow.

**Architecture:** Keep the implementation isolated to the existing login page component and login-scoped CSS selectors inside the shared stylesheet. Use TDD to lock in the new hero structure first, then rewrite the component markup, then layer in the dark visual system and responsive behavior without changing service, store, or router code.

**Tech Stack:** React 18, React Router, TypeScript, Vite, Vitest, Testing Library, CSS

---

## File Map

- Modify: `frontend/src/pages/LoginPage.tsx`
  Purpose: Replace the current editorial login layout with the new hero-style composition while keeping submit behavior unchanged.

- Modify: `frontend/src/index.css`
  Purpose: Add login-only dark-theme tokens and selectors for hero background, floating login console, glow CTA, and responsive stacking.

- Modify: `frontend/src/__tests__/pages/LoginPage.test.tsx`
  Purpose: Lock in the new structure and preserve the submit behavior contract.

- Verify only: `frontend/src/components/SiteFooter.tsx`
  Purpose: Ensure the existing footer still reads acceptably on the dark login background without requiring component logic changes.

- Reference: `docs/superpowers/specs/2026-05-07-login-vicarius-redesign-design.md`
  Purpose: Source of truth for layout, tone, constraints, and non-goals.

## Task 1: Lock the New Login Structure in Tests

**Files:**
- Modify: `frontend/src/__tests__/pages/LoginPage.test.tsx`
- Reference: `docs/superpowers/specs/2026-05-07-login-vicarius-redesign-design.md`

- [ ] **Step 1: Write the failing structure test**

Add expectations for the final page landmarks and labels the redesign must keep visible:

```tsx
expect(screen.getByText(/继续你的 tcf 阅读准备/i)).toBeInTheDocument()
expect(screen.getByText(/登录并继续/i)).toBeInTheDocument()
expect(screen.getByText(/已自动保存/i)).toBeInTheDocument()
expect(screen.getByText(/阅读套题|错题回看|结果记录/i)).toBeInTheDocument()
```

Also remove expectations tied only to the current temporary light redesign if they no longer match the approved dark layout.

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
cd /Users/miao/my_project/allotcf/frontend && npm test -- src/__tests__/pages/LoginPage.test.tsx
```

Expected: FAIL because the existing `LoginPage.tsx` still renders the previous light-layout structure instead of the final Vicarius-inspired version.

- [ ] **Step 3: Keep the submit behavior assertion intact**

Retain the existing interaction test shape:

```tsx
fireEvent.change(screen.getByPlaceholderText(/邮箱/i), { target: { value: 'a@b.com' } })
fireEvent.change(screen.getByPlaceholderText(/密码/i), { target: { value: 'password123' } })
fireEvent.click(screen.getByRole('button', { name: /登录/i }))

await waitFor(() => {
  expect(mockLogin).toHaveBeenCalledWith('a@b.com', 'password123')
})
```

Only update the button matcher if the CTA text becomes `登录并继续`.

- [ ] **Step 4: Run the test again after edits**

Run:

```bash
cd /Users/miao/my_project/allotcf/frontend && npm test -- src/__tests__/pages/LoginPage.test.tsx
```

Expected: Still FAIL, but now for the right reason: the component has not yet been updated to satisfy the new structure.

- [ ] **Step 5: Commit the red test**

```bash
cd /Users/miao/my_project/allotcf
git add frontend/src/__tests__/pages/LoginPage.test.tsx
git commit -m "test: define vicarius login layout expectations"
```

## Task 2: Rebuild the Login Page Markup

**Files:**
- Modify: `frontend/src/pages/LoginPage.tsx`
- Test: `frontend/src/__tests__/pages/LoginPage.test.tsx`

- [ ] **Step 1: Replace the current layout with hero-first markup**

Update the JSX so the page has these high-level sections:

```tsx
<div className="auth-layout login-vicarius-layout">
  <section className="login-vicarius-hero">
    <div className="login-vicarius-copy">...</div>
    <div className="login-vicarius-metrics">...</div>
  </section>
  <section className="login-vicarius-console">
    <div className="login-vicarius-console-header">...</div>
    <form className="auth-form" onSubmit={handleSubmit}>...</form>
    <div className="login-vicarius-console-footer">...</div>
  </section>
</div>
```

Keep the handler, `useNavigate`, `useUserStore`, and `login(...)` call untouched.

- [ ] **Step 2: Preserve the approved copy tone**

Use the existing learning-product voice for:

- hero brand label
- main title
- short supporting paragraph
- study capability cards
- saved-state chip
- register link copy

Do not introduce cybersecurity or SaaS-platform marketing language.

- [ ] **Step 3: Keep the login form semantics stable**

Preserve:

```tsx
<input type="email" placeholder="邮箱" ... required />
<input type="password" placeholder="密码" ... required />
{error ? <p className="status-message error">{error}</p> : null}
```

The only allowed behavior-level text change is the submit button label if needed by the approved design.

- [ ] **Step 4: Run the focused login test**

Run:

```bash
cd /Users/miao/my_project/allotcf/frontend && npm test -- src/__tests__/pages/LoginPage.test.tsx
```

Expected: PASS once the JSX satisfies the structure and still calls `login(...)` on submit.

- [ ] **Step 5: Commit the markup rewrite**

```bash
cd /Users/miao/my_project/allotcf
git add frontend/src/pages/LoginPage.tsx frontend/src/__tests__/pages/LoginPage.test.tsx
git commit -m "feat: rebuild login page structure"
```

## Task 3: Add the Dark Vicarius-Inspired Visual System

**Files:**
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/pages/LoginPage.tsx`

- [ ] **Step 1: Add login-scoped tokens near the root variables**

Add only the tokens needed for the login page:

```css
:root {
  --login-bg: #07111f;
  --login-bg-secondary: #0d1830;
  --login-text: #eef4ff;
  --login-muted: #90a0bf;
  --login-line: rgba(142, 166, 255, 0.18);
  --login-glow: #6b6cff;
  --login-glow-soft: rgba(107, 108, 255, 0.24);
  --login-accent-cyan: #66d9ff;
}
```

Do not repurpose the existing global paper-theme tokens for other pages.

- [ ] **Step 2: Write the dark page shell and hero styles**

Add login-scoped selectors only:

```css
.login-vicarius-layout { ... }
.login-vicarius-hero { ... }
.login-vicarius-hero::before { ... }
.login-vicarius-copy { ... }
.login-vicarius-metrics { ... }
```

Requirements:

- dark near-black background
- large blue-violet glow fields
- generous spacing
- strong title scale
- clear contrast for Chinese copy

- [ ] **Step 3: Style the floating login console**

Add styles for:

```css
.login-vicarius-console { ... }
.login-vicarius-console-header { ... }
.login-vicarius-chip { ... }
.login-vicarius-submit { ... }
```

Requirements:

- translucent dark panel
- cold border
- glow CTA
- high-contrast inputs
- readable error state

- [ ] **Step 4: Retheme the form controls locally**

Add selectors scoped to the login page:

```css
.login-vicarius-layout .editorial-input { ... }
.login-vicarius-layout .editorial-input:focus { ... }
.login-vicarius-layout .status-message.error { ... }
```

Do not change the appearance of the same shared classes on `/register`.

- [ ] **Step 5: Run build to catch CSS or JSX mistakes**

Run:

```bash
cd /Users/miao/my_project/allotcf/frontend && npm run build
```

Expected: PASS with a successful Vite production build.

- [ ] **Step 6: Commit the visual system**

```bash
cd /Users/miao/my_project/allotcf
git add frontend/src/index.css frontend/src/pages/LoginPage.tsx
git commit -m "feat: add vicarius-inspired login visuals"
```

## Task 4: Finish Responsive Behavior and Footer Readability

**Files:**
- Modify: `frontend/src/index.css`
- Verify only: `frontend/src/components/SiteFooter.tsx`

- [ ] **Step 1: Add responsive stacking rules**

Update the existing media-query sections with login-specific rules:

```css
@media (max-width: 920px) {
  .login-vicarius-layout { ... }
  .login-vicarius-console { ... }
  .login-vicarius-metrics { ... }
}
```

Requirements:

- hero content comes first
- login console remains easy to reach
- cards stack cleanly
- glows are reduced on small screens

- [ ] **Step 2: Adjust footer treatment only if contrast fails**

Prefer CSS-only treatment:

```css
.login-vicarius-layout + .site-footer,
body:has(.login-vicarius-layout) .site-footer { ... }
```

If `:has(...)` is too risky for the project, use a safer wrapper-based selector already available in the app structure. Avoid editing `SiteFooter.tsx` unless CSS alone cannot solve the contrast issue.

- [ ] **Step 3: Run the focused login test**

Run:

```bash
cd /Users/miao/my_project/allotcf/frontend && npm test -- src/__tests__/pages/LoginPage.test.tsx
```

Expected: PASS after responsive-only changes.

- [ ] **Step 4: Verify visually in the browser**

Run the dev server:

```bash
cd /Users/miao/my_project/allotcf/frontend && npm run dev -- --host 127.0.0.1 --port 4173
```

Check:

- `http://127.0.0.1:4173/login`
- desktop width
- mobile-width responsive mode

Expected:

- obvious `vicarius.io` influence
- learning-product copy still reads naturally
- login console remains readable and primary

- [ ] **Step 5: Commit the responsive polish**

```bash
cd /Users/miao/my_project/allotcf
git add frontend/src/index.css
git commit -m "feat: polish responsive vicarius login layout"
```

## Task 5: Run Full Verification and Capture Handoff Notes

**Files:**
- Verify: `frontend/src/pages/LoginPage.tsx`
- Verify: `frontend/src/index.css`
- Verify: `frontend/src/__tests__/pages/LoginPage.test.tsx`

- [ ] **Step 1: Run the full frontend test suite**

Run:

```bash
cd /Users/miao/my_project/allotcf/frontend && npm test
```

Expected: PASS for all existing frontend tests, not just the login page.

- [ ] **Step 2: Run the production build one more time**

Run:

```bash
cd /Users/miao/my_project/allotcf/frontend && npm run build
```

Expected: PASS.

- [ ] **Step 3: Record manual verification notes**

Capture, at minimum:

- whether the page now feels like a homepage-scale hero
- whether title contrast is strong enough on the dark background
- whether the button and saved-state chip establish clear hierarchy
- whether `/register` still keeps its previous light-theme appearance

- [ ] **Step 4: Prepare summary for review**

Summarize:

- files changed
- visual decisions actually implemented vs deferred
- test/build evidence
- any remaining mismatch between the shipped page and the spec

- [ ] **Step 5: Commit the final verification pass**

```bash
cd /Users/miao/my_project/allotcf
git add frontend/src/pages/LoginPage.tsx frontend/src/index.css frontend/src/__tests__/pages/LoginPage.test.tsx
git commit -m "test: verify vicarius login redesign"
```
