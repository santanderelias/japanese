from playwright.sync_api import sync_playwright

def run_verification(page):
    page.goto("http://localhost:8080/site.html")
    page.wait_for_timeout(1000)

    # 1. Dashboard
    page.screenshot(path="/tmp/verification_dashboard.png")
    page.wait_for_timeout(500)

    # Navigate to Studying (Module 1)
    page.get_by_role("button", name="学習 (Study)").click()
    page.wait_for_timeout(1000)

    # Navigate to Games (Module 2)
    page.get_by_role("button", name="ゲーム (Games)").click()
    page.wait_for_timeout(1000)

    # Launch Flipcards
    page.get_by_role("button", name="Play Flipcards").click()
    page.wait_for_timeout(800)

    # Flip card
    page.get_by_role("button", name="🔄 Flip Card").click()
    page.wait_for_timeout(800)

    # Back to Games
    page.get_by_role("button", name="⬅️ Back to Games").click()
    page.wait_for_timeout(800)

    # Launch Crossword
    page.get_by_role("button", name="Play Crossword").click()
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            run_verification(page)
            print("Verification script passed successfully!")
        finally:
            browser.close()
