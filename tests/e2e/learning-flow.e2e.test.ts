import { test, expect } from '@playwright/test'

test.describe('Learning Flow E2E Tests', () => {
  test('complete learning session flow', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3000/login')

    // Login
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="login-button"]')

    // Wait for redirect to dashboard
    await expect(page).toHaveURL('http://localhost:3000/')
    await expect(page.locator('h1')).toContainText('Dashboard')

    // Navigate to practice session
    await page.click('[data-testid="start-practice-button"]')
    await expect(page).toHaveURL('http://localhost:3000/practice')

    // Check question is displayed
    await expect(page.locator('[data-testid="question-title"]')).toBeVisible()
    await expect(page.locator('[data-testid="question-description"]')).toBeVisible()

    // Request a hint
    await page.click('[data-testid="request-hint-button"]')
    await expect(page.locator('[data-testid="hint-display"]')).toBeVisible()

    // Submit solution
    await page.fill('[data-testid="code-editor"]', 'print("Hello, World!")')
    await page.click('[data-testid="submit-button"]')

    // Check feedback is displayed
    await expect(page.locator('[data-testid="feedback-display"]')).toBeVisible()
    await expect(page.locator('[data-testid="score-display"]')).toBeVisible()

    // Complete session
    await page.click('[data-testid="complete-session-button"]')
    await expect(page.locator('[data-testid="session-complete"]')).toBeVisible()
  })

  test('competition flow', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="login-button"]')

    // Navigate to competition
    await page.click('[data-testid="join-competition-button"]')
    await expect(page).toHaveURL('http://localhost:3000/competition')

    // Join competition
    await page.click('[data-testid="join-competition-button"]')
    await expect(page.locator('[data-testid="waiting-for-competitors"]')).toBeVisible()

    // Start competition (simulated)
    await page.click('[data-testid="start-competition-button"]')
    await expect(page.locator('[data-testid="competition-timer"]')).toBeVisible()

    // Submit answers
    await page.fill('[data-testid="code-editor"]', 'print("Hello, World!")')
    await page.click('[data-testid="submit-answer-button"]')

    // Check results
    await expect(page.locator('[data-testid="competition-results"]')).toBeVisible()
    await expect(page.locator('[data-testid="leaderboard"]')).toBeVisible()
  })

  test('trainer question management', async ({ page }) => {
    // Login as trainer
    await page.goto('http://localhost:3000/login')
    await page.fill('[data-testid="email-input"]', 'trainer@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="login-button"]')

    // Navigate to trainer dashboard
    await expect(page).toHaveURL('http://localhost:3000/trainer')
    await expect(page.locator('h1')).toContainText('Trainer Dashboard')

    // Navigate to question management
    await page.click('[data-testid="manage-questions-button"]')
    await expect(page).toHaveURL('http://localhost:3000/trainer/questions')

    // Create new question
    await page.click('[data-testid="add-question-button"]')
    await page.fill('[data-testid="question-title"]', 'Test Question')
    await page.fill('[data-testid="question-description"]', 'Test Description')
    await page.selectOption('[data-testid="question-type"]', 'code')
    await page.selectOption('[data-testid="question-difficulty"]', 'beginner')
    await page.click('[data-testid="save-question-button"]')

    // Verify question was created
    await expect(page.locator('[data-testid="question-list"]')).toContainText('Test Question')
  })

  test('admin system monitoring', async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:3000/login')
    await page.fill('[data-testid="email-input"]', 'admin@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="login-button"]')

    // Navigate to admin dashboard
    await expect(page).toHaveURL('http://localhost:3000/admin')
    await expect(page.locator('h1')).toContainText('Admin Dashboard')

    // Check system health
    await expect(page.locator('[data-testid="system-health"]')).toBeVisible()
    await expect(page.locator('[data-testid="uptime-metric"]')).toBeVisible()

    // Navigate to user management
    await page.click('[data-testid="user-management-button"]')
    await expect(page).toHaveURL('http://localhost:3000/admin/users')

    // Check user list
    await expect(page.locator('[data-testid="user-list"]')).toBeVisible()
    await expect(page.locator('[data-testid="user-item"]')).toHaveCount.greaterThan(0)
  })
})




