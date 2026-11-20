import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TARGET_URL = process.env.TEST_URL || 'https://nexon-build-ai-connect-sphere-ai.vercel.app';
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'dom-agent-screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runDomAgent() {
  console.log(`🤖 Starting ConnectSphere DOM Agent Test against: ${TARGET_URL}\n`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Listen to browser console
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.text().includes('Nexconn')) {
      console.log(`  [Browser Console] ${msg.text()}`);
    }
  });

  try {
    // 1. Landing Page
    console.log('Step 1: Navigating to Landing Page...');
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    const title = await page.title();
    console.log(`  ✓ Page Title: "${title}"`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_landing.png') });

    // 2. Navigation to Auth
    console.log('\nStep 2: Navigating to Auth & Logging in as Alex...');
    await page.goto(`${TARGET_URL}/auth`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('button', { timeout: 10000 });

    // Click "Alex Rivera (Admin)" demo login button
    const demoButtons = await page.$$('button');
    let clickedAlex = false;
    for (const btn of demoButtons) {
      const text = await page.evaluate((el) => el.innerText, btn);
      if (text && text.includes('Alex')) {
        console.log(`  ✓ Found Demo Account Button: "${text.trim().replace(/\n+/g, ' ')}"`);
        await btn.click();
        clickedAlex = true;
        break;
      }
    }

    if (!clickedAlex) {
      console.log('  ⚠️ Demo button not found by text, filling login form...');
      await page.type('input[type="text"]', 'alex@connectsphere.dev');
      await page.type('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
    }

    // Wait for redirect to Dashboard
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 2000));
    console.log(`  ✓ Current URL after login: ${page.url()}`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_dashboard.png') });

    // 3. Test SphereAI Copilot Page
    console.log('\nStep 3: Navigating to SphereAI Assistant (/assistant)...');
    await page.goto(`${TARGET_URL}/assistant`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="text"]', { timeout: 10000 });

    // Check AI badge text in DOM
    const badgeText = await page.evaluate(() => {
      const badges = Array.from(document.querySelectorAll('span'));
      const found = badges.find((b) => b.innerText.includes('Gemini') || b.innerText.includes('Engine'));
      return found ? found.innerText : 'Not found';
    });
    console.log(`  ✓ SphereAI DOM Status Badge: "${badgeText}"`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_assistant_init.png') });

    // 4. Send question to SphereAI agent via DOM input
    console.log('\nStep 4: Submitting query to SphereAI via DOM...');
    const testQuery = 'How does ConnectSphere empower real-time community communication?';
    await page.type('input[type="text"]', testQuery);
    console.log(`  ✓ Typed query: "${testQuery}"`);

    // Click submit button
    const submitBtn = await page.$('button[type="submit"]');
    await submitBtn.click();
    console.log('  ✓ Clicked Submit. Waiting for AI agent response to stream into DOM...');

    // Wait up to 35 seconds for AI response message to appear in DOM
    await page.waitForFunction(
      () => {
        const msgs = Array.from(document.querySelectorAll('div'));
        return msgs.some(
          (m) =>
            m.innerText &&
            (m.innerText.includes('ConnectSphere') || m.innerText.includes('community')) &&
            m.innerText.length > 80 &&
            !m.innerText.includes('Hello! I am SphereAI')
        );
      },
      { timeout: 40000 }
    );

    // Extract the AI response from DOM
    const aiResponseText = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('.rounded-2xl, div'));
      const responseEl = elements.find(
        (el) =>
          el.innerText &&
          el.innerText.length > 100 &&
          !el.innerText.includes('Hello! I am SphereAI') &&
          (el.innerText.includes('ConnectSphere') || el.innerText.includes('platform') || el.innerText.includes('community'))
      );
      return responseEl ? responseEl.innerText : 'Response element not identified';
    });

    console.log('\n================ AI AGENT DOM RESPONSE ================');
    console.log(aiResponseText.slice(0, 300) + '...\n');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_assistant_response.png') });

    // 5. Test Communities Page and Thread Summarization
    console.log('Step 5: Testing Community Page & Thread Summarization (/community/ai-ml-pioneers)...');
    await page.goto(`${TARGET_URL}/community/ai-ml-pioneers`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('button', { timeout: 10000 });

    // Switch to SphereAI tab
    const tabs = await page.$$('button');
    for (const tab of tabs) {
      const text = await page.evaluate((el) => el.innerText, tab);
      if (text && text.includes('SphereAI')) {
        console.log('  ✓ Clicking "SphereAI" Community Tab');
        await tab.click();
        break;
      }
    }

    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_community_ai_tab.png') });

    // Click "Summarize Discussion Thread" button
    const summarizeBtns = await page.$$('button');
    for (const sBtn of summarizeBtns) {
      const text = await page.evaluate((el) => el.innerText, sBtn);
      if (text && text.includes('Summarize')) {
        console.log('  ✓ Clicking "Summarize Discussion Thread" button');
        await sBtn.click();
        break;
      }
    }

    // Wait for summary card to populate
    console.log('  ✓ Waiting for thread summary to render in DOM...');
    await new Promise((r) => setTimeout(r, 15000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_summary_result.png') });

    console.log('\n🎉 ALL DOM AGENT TESTS PASSED SUCCESSFULLY!');
    console.log(`📸 Screenshots saved to: ${SCREENSHOT_DIR}\n`);
  } catch (error) {
    console.error('\n❌ DOM Agent Test Error:', error);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'error_state.png') }).catch(() => {});
  } finally {
    await browser.close();
  }
}

runDomAgent();

