const puppeteer = require('puppeteer');

const JOURNEY = {
    LOGIN_FIELD: 'input[name="userid"]',
    PASSWORD_FIELD: 'input[name="password"]',
    LOGIN_BUTTON_FIELD: 'form button.primary',
    FULL_NAME_FIELD: 'input[name="fullname"]',
    USER_ROLE_FIELD: 'div.input-dropdown div[name="role"] input.search',
    USER_DESIGNATION_FIELD: 'div.input-dropdown div[name="designation"] input.search',
    ASSOCIATES_UNDER_FIELD: 'div.input-dropdown div[name="subAssociates"] input.search'
};

const DATA = {
    LOGIN: 'superAdmin',
    PASSWORD: 'superAdmin',
    FULL_NAME: 'Name 16',
    USER_NAME: 'user16',
    USER_PASSWORD: 'password',
    USER_ROLE: 'Manager',
    USER_DESIGNATION: 'Manager'
};

async function executeJourney(isHeadless, launchPage) {

    let startTime = new Date();

    const browser = await puppeteer.launch({
        headless: isHeadless
    });

    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', interceptedRequest => {
        if (interceptedRequest.url().endsWith('.png') || 
            interceptedRequest.url().endsWith('.jpg') ||
            interceptedRequest.url().endsWith('.svg') 
            // ||
            // interceptedRequest.url().endsWith('.css')
            )
          interceptedRequest.abort();
        else
          interceptedRequest.continue();
    });
    await page.goto(launchPage);


    await page.click(JOURNEY.LOGIN_FIELD);
    await page.keyboard.type(DATA.LOGIN);

    await page.click(JOURNEY.PASSWORD_FIELD);
    await page.keyboard.type(DATA.PASSWORD);

    await page.click(JOURNEY.LOGIN_BUTTON_FIELD);
    await page.waitForNavigation();

    await page.click(JOURNEY.LOGIN_FIELD);
    await page.keyboard.type(DATA.USER_NAME);

    await page.click(JOURNEY.PASSWORD_FIELD);
    await page.keyboard.type(DATA.USER_PASSWORD);

    await page.click(JOURNEY.FULL_NAME_FIELD);
    await page.keyboard.type(DATA.FULL_NAME);

    await page.click(JOURNEY.USER_ROLE_FIELD);
    await page.keyboard.type(DATA.USER_ROLE)

    await page.click(JOURNEY.USER_DESIGNATION_FIELD);
    await page.keyboard.type(DATA.USER_DESIGNATION);

    await page.click(JOURNEY.LOGIN_BUTTON_FIELD);
    await page.waitForNavigation();

    browser.close();

    let endTime = new Date();

    console.log('Elapsed Time', endTime.getTime() - startTime.getTime());
 
};

module.exports = executeJourney;

