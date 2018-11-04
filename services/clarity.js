const puppeteer = require('puppeteer');

const JOURNEY = {
    LOGIN_FIELD: 'input[id="ppm_login_username"]',
    PASSWORD_FIELD: 'input[id="ppm_login_password"]',
    LOGIN_BUTTON_FIELD: 'input[id="ppm_login_button"]',
    PAGINATION_INPUT_FIELD: 'table[id="portlet-table-timeadmin.timesheetBrowser"] div.ppm_gridcontent div input.ppm_field',
    NEXT_BUTTON_FIELD: 'button[id="nextPageButton"]'
};
//*table[id="portlet-table-timeadmin.timesheetBrowser"] div.ppm_gridcontent div input.ppm_field ppm_pagination_input
//*[@id="d101597e167"]/div/text()[2]
const DATA = {
    LOGIN: 'superAdmin',
    PASSWORD: 'superAdmin',
    FULL_NAME: 'Name 16',
    USER_NAME: 'user16',
    USER_PASSWORD: 'password',
    USER_ROLE: 'Manager',
    USER_DESIGNATION: 'Manager'
};

let ALL_DATA = [];

async function executeJourney(isHeadless, launchPage, credentials) {
    let startTime = new Date();

    const browser = await puppeteer.launch({
        headless: isHeadless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', interceptedRequest => {
        if (interceptedRequest.url().endsWith('.png') || 
            interceptedRequest.url().endsWith('.jpg') ||
            interceptedRequest.url().endsWith('.svg') ||
            interceptedRequest.url().endsWith('.gif')
            // ||
            // interceptedRequest.url().endsWith('.css')
            )
          interceptedRequest.abort();
        else
          interceptedRequest.continue();
    });
    await page.goto(launchPage, {waitUntil: 'networkidle0'});


    await page.click(JOURNEY.LOGIN_FIELD);
    await page.keyboard.type(credentials.username);

    await page.click(JOURNEY.PASSWORD_FIELD);
    await page.keyboard.type(credentials.password);

    await page.click(JOURNEY.LOGIN_BUTTON_FIELD);
    await page.waitForNavigation();

    await updatePageDetails(page);

    const text = await page.evaluate(() => document.querySelector('table[id="portlet-table-timeadmin.timesheetBrowser"] div.ppm_gridcontent div input.ppm_field').getAttribute('aria-label'));

    let numberOfPages, temp = text.split('of ');
    if(temp && temp.length > 0){
        numberOfPages = parseInt(temp[1], 10);
    }
    if(numberOfPages){
        for(let i= 1; i < numberOfPages; i++){
            await page.click(JOURNEY.NEXT_BUTTON_FIELD);
            await page.waitForNavigation();
            await updatePageDetails(page);
        }
    }
    browser.close();

    let endTime = new Date();

    // console.log('Elapsed Time', endTime.getTime() - startTime.getTime());
    return {data: ALL_DATA, timeTaken: parseInt((endTime.getTime() - startTime.getTime()), 10)/1000};
}

async function updatePageDetails(page) {
    let items = await page.evaluate(() => document.querySelectorAll('table[id="portlet-table-timeadmin.timesheetBrowser"] table tbody tr'));
    if(items && Object.keys(items).length){
        for(let i = 1; i <= Object.keys(items).length; i++){
            let baseString = 'table[id="portlet-table-timeadmin.timesheetBrowser"] table tbody tr:nth-child('+i+')';
            let name = await page.evaluate((sel) => {
                    return document.querySelector(sel +' td[column="8"]').innerText
                }, baseString),
                startDate = await page.evaluate((sel) => document.querySelector(sel +'  td[column="10"]').innerText, baseString),
                status = await page.evaluate((sel) => document.querySelector(sel +'  td[column="11"]').innerText, baseString),
                pending = await page.evaluate((sel) => document.querySelector(sel +'  td[column="14"]').innerText, baseString);
            ALL_DATA.push({name, startDate, status, pending});
        }
    }
    
}

module.exports = executeJourney;