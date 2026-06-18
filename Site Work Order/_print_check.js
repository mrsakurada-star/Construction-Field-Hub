const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const target = 'C:/Users/sakurada/Dropbox/claude thinking/Construction Field Hub/Site Work Order/index.html';
  const fileUrl = 'file://' + target.replace(/ /g, '%20');
  await page.goto(fileUrl);
  await page.waitForTimeout(500);

  // fill basic fields
  await page.fill('#fProjectName', 'テスト工事 大規模改修プロジェクト');
  await page.fill('#fAddress', '東京都千代田区丸の内1-1-1');
  await page.waitForTimeout(300);

  // add many contractors to stress-test layout
  for (let i = 0; i < 6; i++) {
    await page.click('button.btn-add');
  }
  await page.waitForTimeout(300);
  const cls = await page.evaluate(() => document.getElementById('contractorList').className);
  console.log('density class:', cls);

  const contractorCount = await page.evaluate(() => document.querySelectorAll('.c-col').length);
  console.log('contractor columns:', contractorCount);

  await page.screenshot({ path: '_screen_normal.png', fullPage: true });

  // measure #doc height vs viewport (A4 landscape @ 8mm margin approx 277mm x 190mm content area)
  const docBox = await page.evaluate(() => {
    const doc = document.getElementById('doc');
    return { height: doc.scrollHeight, width: doc.scrollWidth };
  });
  console.log('doc size px:', docBox);

  // emulate print media and check overflow
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(300);
  const printBox = await page.evaluate(() => {
    const doc = document.getElementById('doc');
    return { scrollHeight: doc.scrollHeight, scrollWidth: doc.scrollWidth, clientHeight: doc.clientHeight };
  });
  console.log('print doc size px:', printBox);

  await page.pdf({ path: 'C:/Temp_pwcheck_out.pdf', format: 'A4', landscape: true, printBackground: true, margin: { top: '8mm', bottom: '8mm', left: '8mm', right: '8mm' } });
  console.log('pdf saved');

  await browser.close();
})();
