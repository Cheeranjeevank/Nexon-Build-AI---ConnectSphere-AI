/**
 * ConnectSphere Automated Walkthrough Video Recorder
 * Uses Chrome DevTools Protocol to capture high-definition 60/25fps frames
 * and encodes them via OpenCV into a demo video.
 */

import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:5173';
const FRAMES_DIR = '/tmp/connectsphere_frames';

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log('🎬 Starting ConnectSphere Video Recording Session...');

  if (!fs.existsSync(FRAMES_DIR)) {
    fs.mkdirSync(FRAMES_DIR, { recursive: true });
  } else {
    // Clear old frames
    const files = fs.readdirSync(FRAMES_DIR);
    for (const file of files) {
      fs.unlinkSync(path.join(FRAMES_DIR, file));
    }
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
    },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--window-size=1280,800',
    ],
  });

  const page = await browser.newPage();
  const client = await page.target().createCDPSession();

  let frameIndex = 0;
  client.on('Page.screencastFrame', async ({ data, sessionId }) => {
    try {
      const buffer = Buffer.from(data, 'base64');
      const filename = path.join(FRAMES_DIR, `frame_${String(frameIndex).padStart(5, '0')}.jpg`);
      fs.writeFileSync(filename, buffer);
      frameIndex++;
      await client.send('Page.screencastFrameAck', { sessionId });
    } catch (e) {
      // Ignore dropped frame during shutdown
    }
  });

  console.log('📹 Initializing Screencast stream...');
  await client.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 90,
    everyNthFrame: 1,
  });

  try {
    // ----------------------------------------------------
    // SCENE 1: Landing Page (Hero & Value Proposition)
    // ----------------------------------------------------
    console.log('📍 Scene 1: Landing Page...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await sleep(2500);

    // Smooth scroll down to highlight features
    await page.evaluate(async () => {
      window.scrollBy({ top: 450, behavior: 'smooth' });
    });
    await sleep(2000);

    await page.evaluate(async () => {
      window.scrollBy({ top: 450, behavior: 'smooth' });
    });
    await sleep(2000);

    // Scroll back to top
    await page.evaluate(async () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    await sleep(1500);

    // ----------------------------------------------------
    // SCENE 2: Authentication & Dashboard
    // ----------------------------------------------------
    console.log('📍 Scene 2: Sign-in & Live Dashboard...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await sleep(1500);

    // Type login credentials
    await page.type('input[type="text"], input[type="email"]', 'alex@connectsphere.dev', { delay: 35 });
    await page.type('input[type="password"]', 'password123', { delay: 35 });
    await sleep(800);

    // Submit form
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await sleep(3500); // Allow Nexconn SDK to connect and display green status

    // ----------------------------------------------------
    // SCENE 3: Community & Nexconn Group Chat
    // ----------------------------------------------------
    console.log('📍 Scene 3: Community Hub & Nexconn Group Channel...');
    await page.goto(`${BASE_URL}/community/fullstack-devs-hub`, { waitUntil: 'networkidle2' });
    await sleep(3000);

    // Scroll into chat input
    const chatInput = await page.$('input[placeholder*="Type a message"], input[placeholder*="message"]');
    if (chatInput) {
      await chatInput.type('🚀 Welcome team to the ConnectSphere sync! Powered by Nexconn Chat SDK.', { delay: 40 });
      await sleep(1000);
      await page.keyboard.press('Enter');
      await sleep(2500);
    }

    // ----------------------------------------------------
    // SCENE 4: AI Catch-Up Summarization (Google Gemini Live)
    // ----------------------------------------------------
    console.log('📍 Scene 4: AI Catch-Up Summarization...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const aiTab = buttons.find((b) => b.innerText.includes('AI Catch-Up') || b.innerText.includes('AI Summary'));
      if (aiTab) aiTab.click();
    });
    await sleep(3500);

    // ----------------------------------------------------
    // SCENE 5: Discussion Rooms (Nexconn OpenChannel)
    // ----------------------------------------------------
    console.log('📍 Scene 5: Live Discussion Rooms (OpenChannel)...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const roomsTab = buttons.find((b) => b.innerText.includes('Discussion Rooms') || b.innerText.includes('Rooms'));
      if (roomsTab) roomsTab.click();
    });
    await sleep(3000);

    // ----------------------------------------------------
    // SCENE 6: Direct Messaging & AI Tone Polish
    // ----------------------------------------------------
    console.log('📍 Scene 6: 1-on-1 Direct Messaging & AI Tone Polish...');
    await page.goto(`${BASE_URL}/messages`, { waitUntil: 'networkidle2' });
    await sleep(3000);

    // Select first contact in DM list
    await page.evaluate(() => {
      const contactCards = document.querySelectorAll('button, [role="button"]');
      for (const card of contactCards) {
        if (card.innerText.includes('Sarah') || card.innerText.includes('Elena') || card.innerText.includes('Marcus')) {
          card.click();
          break;
        }
      }
    });
    await sleep(2000);

    // Type a rough draft in message input
    const dmInput = await page.$('input[placeholder*="Type a message"], input[placeholder*="message"], textarea');
    if (dmInput) {
      await dmInput.type('Hey can u review my pr asap thanks', { delay: 45 });
      await sleep(1500);

      // Trigger AI Polish
      await page.evaluate(() => {
        const wandBtn = document.querySelector('button[title*="Polish"], button[title*="AI"]');
        if (wandBtn) wandBtn.click();
      });
      await sleep(2000);

      // Send polished message
      await page.keyboard.press('Enter');
      await sleep(3000);
    }

    // ----------------------------------------------------
    // SCENE 7: AI Assistant Hub
    // ----------------------------------------------------
    console.log('📍 Scene 7: Community AI Assistant...');
    await page.goto(`${BASE_URL}/assistant`, { waitUntil: 'networkidle2' });
    await sleep(3000);

    console.log('🏁 Walkthrough sequence finished.');
  } finally {
    try {
      await client.send('Page.stopScreencast');
    } catch (e) {}
    await browser.close();
  }

  console.log(`📸 Total frames recorded: ${frameIndex}`);
  console.log('🎞️  Compiling frames into high-definition MP4 video...');
  execSync('python3 backend/scripts/compile-video.py', { stdio: 'inherit' });
  console.log('🎉 Recording & Compilation Complete!');
}

main().catch((err) => {
  console.error('❌ Video recording failed:', err);
  process.exit(1);
});
