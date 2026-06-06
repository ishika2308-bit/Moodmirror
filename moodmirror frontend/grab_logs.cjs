const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => {
      console.log(`PAGE LOG: ${msg.type().toUpperCase()}: ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
      console.log(`PAGE ERROR: ${error.message}`);
    });
    
    page.on('response', response => {
      if (!response.ok()) {
        console.log(`HTTP ${response.status()}: ${response.url()}`);
      }
    });

    console.log("Navigating to localhost:5000...");
    await page.goto('http://localhost:5000', { waitUntil: 'networkidle0', timeout: 10000 });
    
    await browser.close();
  } catch (e) {
    console.error("Puppeteer script failed:", e.message);
    process.exit(1);
  }
})();
