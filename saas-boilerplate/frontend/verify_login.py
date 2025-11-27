from playwright.sync_api import sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to Login page
        page.goto("http://localhost:4173/login")
        page.screenshot(path="/home/jules/verification/login.png")
        print("Login screenshot taken")

        # Navigate to Dashboard (Protected) - this will redirect to Login or show error if not mocked
        # Since backend isn't running in this preview context fully connected to frontend preview,
        # we can just verify the Login page renders correctly.

        browser.close()

if __name__ == "__main__":
    verify_frontend()
