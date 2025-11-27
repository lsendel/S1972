from playwright.sync_api import sync_playwright, expect
import time
import os

BASE_URL = "http://localhost:5173"
SCREENSHOT_DIR = "./test_screenshots"

def run_integration_tests():
    if not os.path.exists(SCREENSHOT_DIR):
        os.makedirs(SCREENSHOT_DIR)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Capture logs
        page.on("console", lambda msg: print(f"BROWSER LOG: {msg.text}"))
        page.on("pageerror", lambda err: print(f"BROWSER ERROR: {err}"))

        try:
            print("Starting Integration Tests...")

            # 1. Login
            print("Testing Login...")
            page.goto(f"{BASE_URL}/login")

            # Debugging: Wait for the form or any content
            try:
                page.wait_for_selector('input[name="email"]', timeout=5000)
            except Exception as e:
                print("Timeout waiting for email input. Dumping page content:")
                print(page.content())
                page.screenshot(path=f"{SCREENSHOT_DIR}/login_debug.png")

            page.fill('input[name="email"]', "test@example.com") # Assuming this user exists or we might fail if not seeded
            page.fill('input[name="password"]', "password123")

            # Note: If 2FA is required, this will fail or stop.
            # Ideally we should seed the DB or use a fresh user.
            # For this verification script, let's assume standard login works first.

            # Debug request
            with page.expect_response("**/login/") as response_info:
                page.click('button[type="submit"]')

            response = response_info.value
            print(f"DEBUG: Login Response Status: {response.status}")
            print(f"DEBUG: Login Response Body: {response.text()}")

            # Check for success redirect (either to /app or verify 2FA)
            try:
                # Wait for dashboard text or 2FA input
                page.wait_for_function(
                    "document.body.innerText.includes('Welcome back') || document.querySelector('input[name=\"otp_code\"]')",
                    timeout=5000
                )
            except:
                print("Timeout waiting for dashboard or 2FA.")

            if "login" in page.url and page.locator('input[name="otp_code"]').is_visible():
                 print("2FA Code Input Visible - Feature Verified.")
            elif "app" in page.url or "Welcome back" in page.locator('body').inner_text():
                 print("Login successful, redirected to Dashboard.")
                 page.screenshot(path=f"{SCREENSHOT_DIR}/dashboard.png")
            else:
                 print("Login state unclear.")
                 print(f"DEBUG: Page Text: {page.locator('body').inner_text()}")

            # 2. Check Profile / 2FA Setup UI
            print("Testing Profile & 2FA Setup UI...")
            page.goto(f"{BASE_URL}/app/profile")
            time.sleep(1)

            if page.locator('text="Two-Factor Authentication"').is_visible():
                print("2FA Section found in Profile.")
                page.screenshot(path=f"{SCREENSHOT_DIR}/profile_2fa.png")
            else:
                print("2FA Section NOT found in Profile.")

            # 3. Check Organization Settings & Invitation UI
            print("Testing Organization Settings...")
            page.goto(f"{BASE_URL}/app/organization")
            time.sleep(1)

            try:
                page.wait_for_selector('text="Organization Settings"', timeout=5000)
                print("Organization Settings Page Loaded.")

                # Check Invite Form or Create Form
                if page.locator('input[name="email"]').is_visible():
                      print("Invite Form Visible.")
                elif page.locator('button:text("Create Organization")').is_visible():
                      print("Create Organization Form Visible.")
                else:
                      print("No Organization form visible.")

                page.screenshot(path=f"{SCREENSHOT_DIR}/org_settings.png")
            except:
                 print("Organization Settings Page NOT Loaded (Timeout).")
                 print(f"DEBUG: Page Text: {page.locator('body').inner_text()}")

            # 4. Check Invitation Accept Page (Public)
            print("Testing Invitation Accept Page...")
            # We use a fake token just to see if the page loads and handles error/loading state
            page.goto(f"{BASE_URL}/invitation/fake-token-123")
            time.sleep(1)

            if page.locator('text="Invalid Invitation"').is_visible() or page.locator('text="Loading"').is_visible():
                 print("Invitation Accept Page Loaded (Error/Loading state verified).")
                 page.screenshot(path=f"{SCREENSHOT_DIR}/invitation_page.png")
            else:
                 print("Invitation Accept Page failed to load correctly.")

            # 5. Check Subscription Page
            print("Testing Subscription Page...")
            page.goto(f"{BASE_URL}/app/subscription")
            try:
                page.wait_for_selector('text="Subscription"', timeout=5000)
                # Check for "Starter" plan which we seeded
                page.wait_for_selector('text="Starter"', timeout=5000)
                print("Subscription Page Loaded & Plans Visible.")
                page.screenshot(path=f"{SCREENSHOT_DIR}/subscription.png")
            except:
                 print("Subscription Page Failed to Load.")
                 print(f"DEBUG: Page Text: {page.locator('body').inner_text()}")

        except Exception as e:
            print(f"Test Failed: {e}")
            page.screenshot(path=f"{SCREENSHOT_DIR}/test_failure.png")
        finally:
            browser.close()
            print("Tests Completed.")

if __name__ == "__main__":
    run_integration_tests()
