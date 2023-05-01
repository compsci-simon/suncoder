import puppeteer from "puppeteer";

describe("App.js", () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: false, slowMo: 500});
    page = await browser.newPage();
  });

  it("Check page title", async () => {
    await page.goto("http://localhost:3000");
    const title = await page.title();
    expect(title).toEqual('Suncoder')
  });

  it("Check user create page", async () => {
    await page.goto("http://localhost:3000/users/edit")
    await page.click("#bar-body > div.MuiBox-root.css-1kuqfkb > div.css-16a937b > div > form > div > div:nth-child(4) > button")
    try {
      await page.$('#bar-body > div.MuiBox-root.css-1kuqfkb > div.css-16a937b > div > form > div > div:nth-child(2) > div > p')
    } catch (error) {
      fail('Helper text is not visible')
    }
    try {
      await page.$('#bar-body > div.MuiBox-root.css-1kuqfkb > div.css-16a937b > div > form > div > div:nth-child(3) > div > p')
    } catch (error) {
      fail('Helper text is not visible')
    }
  })

  afterAll(() => browser.close());
});