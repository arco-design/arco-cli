import resolveGlobal from 'resolve-global';
import locale from './locale';

const TIMEOUT = 10 * 1000;

/**
 * Auto screenshot
 * @param url URL of material preview page
 * @param path Path to save screenshot
 * @param selector Selector of DOM to screenshot
 * @returns {Promise<void>}
 */
export default async function ({ url, path, selector }) {
  if (url) {
    let puppeteer;
    try {
      puppeteer = require(resolveGlobal('puppeteer'));
    } catch (e) {
      throw new Error(locale.ERROR_NEED_PUPPETEER);
    }

    const browser = await puppeteer.launch({
      width: 1300,
    });
    const page = await browser.newPage();
    await page.goto(url, { timeout: TIMEOUT });
    const screenElement = await page.waitForSelector(selector, { timeout: TIMEOUT });
    await screenElement.screenshot({ path });

    await browser.close();
  }
}
