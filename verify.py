from playwright.sync_api import sync_playwright

def verify_feature(page):
    page.goto("http://localhost:3000")
    page.wait_for_timeout(2000)

    # Take screenshot of the initial state, ensuring the bottom nav has "Scanner"
    page.screenshot(path="/home/jules/verification/verification.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(record_video_dir="/home/jules/verification/video")
        page = context.new_page()
        try:
            verify_feature(page)
        finally:
            context.close()
            browser.close()
