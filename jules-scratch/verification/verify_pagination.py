from playwright.sync_api import sync_playwright, expect

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"Browser console: {msg.text}"))

        # Set a dummy auth token in localStorage before navigating
        page.goto("http://localhost:5173") # Go to the root to set the token
        page.evaluate("() => { localStorage.setItem('authToken', 'dummy-token'); }")

        # Navigate to the stash browser
        page.goto("http://localhost:5173/utilities/stash")

        try:
            # Wait for the sidebar to be visible with a longer timeout
            sidebar = page.locator(".stash-sidebar")
            expect(sidebar).to_be_visible(timeout=10000)
        except Exception as e:
            print("Error waiting for sidebar:", e)
            browser.close()
            return

        # Find and click the first collection link in the sidebar
        first_collection_link = page.locator(".sidebar-nav .nav-link").first
        expect(first_collection_link).to_be_visible()

        # Get the href and construct the expected URL patterns
        href = first_collection_link.get_attribute("href")
        page1_url_pattern = f"http://localhost:5173{href}/page/1"
        page2_url_pattern = f"http://localhost:5173{href}/page/2"

        first_collection_link.click()

        # Wait for the URL to change to the collection page
        expect(page).to_have_url(page1_url_pattern)

        # Wait for pagination controls to be visible
        pagination_controls = page.locator(".pagination-controls")
        expect(pagination_controls).to_be_visible()

        # Take a screenshot of the initial state
        page.screenshot(path="jules-scratch/verification/pagination_initial.png")

        # Find the page input, fill it with a new page number, and press Enter
        page_input = page.locator(".page-input")
        expect(page_input).to_be_visible()
        page_input.fill("2")
        page_input.press("Enter")

        # Wait for the URL to change to page 2
        expect(page).to_have_url(page2_url_pattern)

        # Take a final screenshot of the updated pagination controls
        page.screenshot(path="jules-scratch/verification/pagination_page2.png")

        browser.close()

if __name__ == "__main__":
    run_verification()
