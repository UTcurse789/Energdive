import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/issues', { waitUntil: 'networkidle' });
  
  // wait for loading to finish
  await page.waitForSelector('h3', { timeout: 10000 }).catch(() => {});
  
  const headers = await page.$$eval('.grid h3', els => els.map(el => el.textContent.trim()));
  console.log("RENDERED ISSUES IN ORDER:");
  headers.forEach((h, i) => console.log(`${i+1}. ${h}`));
  
  await browser.close();
}
test();
