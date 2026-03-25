# WTicket Tests

End-to-end tests using Playwright for browser automation testing.

## Running Tests

### 1. Install dependencies

```bash
npm install -D @playwright/test
npx playwright install chromium
```

### 2. Configure tests

Tests use the live JSONBin.io API. Ensure your test database has appropriate data.

### 3. Run tests

```bash
npx playwright test
```

### 4. Run with UI (interactive mode)

```bash
npx playwright test --ui
```

### 5. Run specific test file

```bash
npx playwright test tests/app.spec.js
```

## Test Coverage

| Test | Description |
|------|-------------|
| **Homepage** | Verifies dashboard loads with stats |
| **Login Flow** | Tests user authentication |
| **Dark Mode** | Verifies theme toggle functionality |
| **Contact Page** | Checks contact information renders |
| **Stats Banner** | Validates global statistics display |

## Project Structure

```
tests/
├── app.spec.js      # Main test suite
└── README.md        # This file
```

## Notes

- Tests are designed for the deployed GitHub Pages URL
- Some tests require existing user data in JSONBin
- Admin credentials: `wisrovi@wticket.com` / `wisrovi_wticket`
