//  node automation.js --url="https://www.hackerrank.com" --creds="creds.json"

let minimist = require('minimist');
let puppeteer = require('puppeteer');
let fs = require('fs');
const { url } = require('inspector');

let args = minimist(process.argv);

let credsJson = fs.readFileSync(args.creds, 'utf-8');
let creds = JSON.parse(credsJson);

async function run() {
    let browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    let page = await browser.newPage();
    await page.goto(args.url);

    //click login
    await page.waitForSelector('a[href="https://www.hackerrank.com/access-account/"]');
    await page.click('a[href="https://www.hackerrank.com/access-account/"]');

    //click login 2
    await page.waitForSelector('a[href="https://www.hackerrank.com/login"]');
    await page.click('a[href="https://www.hackerrank.com/login"]');

    //type username
    await page.waitForSelector('input[name="username"]');
    await page.type('input[name="username"]', creds.username, { delay: 50 });

    //type password
    await page.waitForSelector('input[name="password"]');
    await page.type('input[name="password"]', creds.password, { delay: 50 });

    //click login button
    await page.waitForSelector('button[data-analytics="LoginPassword"]');
    await page.click('button[data-analytics="LoginPassword"]');

    //click on compete
    await page.waitForSelector('a[href="/contests"]');
    await page.click('a[href="/contests"]');

    //click on manage contests    
    await page.waitForSelector('a[href="/administration/contests/"]');
    await page.click('a[href="/administration/contests/"]');

    await page.waitForSelector('a[data-attr1="Last"]');

    let totalPages = await page.$eval('a[data-attr1="Last"]', function (el) {
        return el.getAttribute("data-page");
    });

    for (let i = 1; i <= totalPages; i++) {
        //handle a page
        await handleAPage(page, creds, browser);

        if (i != totalPages) {
            await page.waitForSelector('a[data-attr1="Right"]');
            await page.click('a[data-attr1="Right"]');
        }

    }

    // wait and close
    await page.waitFor(3000);

    await browser.close();
};

async function handleAPage(page, creds, browser) {
    //get all the contests urls    
    await page.waitForSelector('a.backbone.block-center');

    let urls = await page.$$eval('a.backbone.block-center', function (atags) {
        let hrefs = [];

        for (let i = 0; i < atags.length; i++) {
            let href = atags[i].getAttribute("href");
            hrefs.push(href);
        }
        return hrefs;
    });

    for (let i = 0; i < urls.length; i++) {
        await handleAContest(args.url + urls[i], creds.moderators, browser);
    }
}

async function handleAContest(url, modNames, browser) {
    let newPage = await browser.newPage();
    await newPage.goto(url);

    // await newPage.waitFor(2000);

    await newPage.waitForSelector('li[data-tab="moderators"]');
    await newPage.click('li[data-tab="moderators"]');

    for (let i = 0; i < modNames.length; i++) {
        await newPage.waitForSelector('input[id="moderator"]');
        await newPage.type('input[id="moderator"]', modNames[i], { delay: 30 });
        await newPage.keyboard.press("Enter");
    }

    await newPage.close();
}

run();