const puppeteer = require('puppeteer-core');

const BASE = process.argv[2] || 'http://localhost:5174';
const ROUTE = process.argv[3] || '/admin/dashboard';
const OUT = process.argv[4] || 'shot.png';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;
const token = `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ user_id: 1, role: 'admin', full_name: 'Jorge Pérez', exp })}.sig`;
const user = { id: 1, role: 'admin', full_name: 'Jorge Pérez', user_code: 'ADMIN01', location_id: null };

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--window-size=1600,1000'],
    defaultViewport: { width: 1600, height: 1000, deviceScaleFactor: 1.25 },
  });
  const page = await browser.newPage();
  // Cargar origen y sembrar sesión admin
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.evaluate((t, u) => {
    localStorage.setItem('botica_token', t);
    localStorage.setItem('botica_user', u);
  }, token, JSON.stringify(user));
  await page.goto(BASE + ROUTE, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: OUT, fullPage: true });
  await browser.close();
  console.log('OK ->', OUT);
})().catch(e => { console.error(e); process.exit(1); });
