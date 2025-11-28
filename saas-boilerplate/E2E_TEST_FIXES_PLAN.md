# E2E Test Fixes - Execution Plan

**Status:** Ready to Execute
**Current:** 6/22 passing (27%)
**Target:** 22/22 passing (100%)
**Estimated Time:** 2.5-3 hours

---

## PRIORITY 1: LOGIN REDIRECT (13 Tests - 54 min) 🔴 CRITICAL

### Root Cause
Login navigates to `/app` → Router redirects to `/onboarding` → Test expects `/app/test-org` pattern → **TIMEOUT**

### Fix
**File:** `frontend/src/pages/auth/Login.tsx` (line 17)

**Change:**
```typescript
// Before:
navigate('/app');

// After:
const orgSlug = import.meta.env.VITE_DEFAULT_ORG_SLUG || 'test-org';
navigate(`/app/${orgSlug}`);
```

**Also add to `.env.e2e`:**
```
VITE_DEFAULT_ORG_SLUG=test-org
```

**Impact:** Fixes all 13 dashboard/settings tests

---

## PRIORITY 2: PASSWORD VALIDATION (1 Test - 20 min) 🟡

### Root Cause
Password input missing HTML5 `minlength` attribute

### Fix
**File:** `frontend/src/pages/auth/Signup.tsx` (line ~80)

**Add:**
```typescript
<input
  id="password"
  name="password"
  type="password"
  required
  minLength={10}  // ADD THIS
  value={password}
  onChange={(e) => setPassword(e.target.value)}
/>
```

**Impact:** Fixes 1 test

---

## PRIORITY 3: ERROR MESSAGE SELECTOR (1 Test - 34 min) 🟡

### Root Cause
Test regex `/failed to login|invalid/i` doesn't match actual error "Unable to log in with provided credentials"

### Fix
**File:** `frontend/e2e/auth.spec.ts` (line 67)

**Change:**
```typescript
// Before:
await expect(page.locator('text=/failed to login|invalid/i')).toBeVisible()

// After:
await expect(page.locator('text=/unable to log in|failed/i')).toBeVisible()
```

**Impact:** Fixes 1 test

---

## PRIORITY 4: FORGOT PASSWORD SUCCESS (1 Test - 52 min) 🟡

### Root Cause
Timing issue - test checks for success message before component re-renders

### Fix
**File:** `frontend/e2e/auth.spec.ts` (line ~100)

**Add network wait:**
```typescript
// Setup listener before clicking
const responsePromise = page.waitForResponse(
  response => response.url().includes('/password/reset/') && response.status() === 200
)

await page.getByRole('button', { name: /send reset link/i }).click()
await responsePromise  // Wait for API

await expect(page.locator('text=/check your email/i')).toBeVisible()
```

**Impact:** Fixes 1 test

---

## EXECUTION ORDER

### Phase 1: Critical Login Fix (1 hour)
1. ✅ Verify test user exists
2. ✅ Update Login.tsx navigation logic
3. ✅ Add env variable to .env.e2e
4. ✅ Test manually in browser
5. ✅ Run dashboard tests

### Phase 2: Quick Wins (30 min)
6. ✅ Add minLength to password input
7. ✅ Update error message test regex
8. ✅ Test both manually

### Phase 3: Forgot Password (30 min)
9. ✅ Add network wait to test
10. ✅ Verify success message appears
11. ✅ Test manually

### Phase 4: Full Verification (30 min)
12. ✅ Run complete E2E suite
13. ✅ Verify 22/22 passing
14. ✅ Cross-browser test (optional)
15. ✅ Document fixes

---

## QUICK START COMMANDS

```bash
# 1. Ensure services running
cd /Users/lsendel/Projects/S1972/saas-boilerplate
docker-compose up -d db redis backend

# 2. Verify test user
docker exec saas-boilerplate-backend-1 python manage.py create_test_user

# 3. Make fixes (see above)

# 4. Run tests
cd frontend
npm run test:e2e -- --project=chromium

# 5. View results
npx playwright show-report
```

---

## SUCCESS CRITERIA

- ✅ All 22 tests pass
- ✅ No blank pages
- ✅ No console errors
- ✅ Build succeeds
- ✅ Type check passes

---

## ROLLBACK (if needed)

```bash
# Restore Login.tsx
git checkout frontend/src/pages/auth/Login.tsx

# Restore test files
git checkout frontend/e2e/auth.spec.ts

# Restore Signup.tsx
git checkout frontend/src/pages/auth/Signup.tsx
```

---

**Ready to execute!** Start with Priority 1 (Login Redirect).
