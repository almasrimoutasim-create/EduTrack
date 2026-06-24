const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.toString());
  });

  console.log("Navigating to student portal...");
  await page.goto('http://localhost:5173/student-portal', { waitUntil: 'networkidle2' });
  
  // Wait a little bit for rendering
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
  console.log("Done");
})();
