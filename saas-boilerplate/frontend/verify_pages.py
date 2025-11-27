from playwright.sync_api import sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Navigate to login
            page.goto("http://localhost:5173/login")
            page.wait_for_selector('h2:has-text("Sign in to your account")', timeout=10000)
            page.screenshot(path="/home/jules/verification/login.png")
            print("Login page verified")

            # Navigate to signup
            page.goto("http://localhost:5173/signup")
            page.wait_for_selector('h2:has-text("Create your account")', timeout=10000)
            page.screenshot(path="/home/jules/verification/signup.png")
            print("Signup page verified")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/home/jules/verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_frontend()
