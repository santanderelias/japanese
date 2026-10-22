from playwright.sync_api import sync_playwright

def run_verification(page):
    page.goto("http://localhost:8000/site.html")
    page.wait_for_timeout(1000)

    # 1. Dashboard
    page.screenshot(path="/home/jules/verification/screenshots/verification.png")
    page.wait_for_timeout(500)

    # Navigate to Flashcards (Module 1)
    page.get_by_role("button", name="単語 (Cards)").click()
    page.wait_for_timeout(1000)

    # Flip flashcard
    page.get_by_role("button", name="🔄 Flip Card").click()
    page.wait_for_timeout(800)

    # Navigate to Quiz (Module 2)
    page.get_by_role("button", name="テスト (Quiz)").click()
    page.wait_for_timeout(1000)

    # Start Quiz
    page.get_by_role("button", name="🚀 Start Test").click()
    page.wait_for_timeout(800)

    # Navigate to Minigames (Module 3)
    page.get_by_role("button", name="ゲーム (Games)").click()
    page.wait_for_timeout(1000)

    # Launch Crossword
    page.get_by_role("button", name="Play Crossword").click()
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_verification(page)
        finally:
            context.close()
            browser.close()
