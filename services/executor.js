const puppeteer = require('puppeteer');
var journeySelector = require('./journey_selector');
var browser = "";
let browserRunning = false;
let journey = {};

let ALL_DATA = [];
let ERRORS = [];

/**
 *
 * @param {*} isHeadless
 * @param {*} launchPage
 * @param {*} credentials
 */
async function executeJourney(journeyDetails, isHeadless, data) {
    // console.log('Inside execute');
    var browserLoadedTime, startTime = new Date();
    journey = journeyDetails;
    try {
        browser = await puppeteer.launch({
            headless: isHeadless,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        // console.log('Browser lunched');

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
        await page.goto(journey.url, {waitUntil: 'networkidle0'});
        // console.log('Page launched!');

        if(journey.action_sequence){
          for(const step of journey.action_sequence){
            await executeStep(page, step, data);
          }
        }
        await page.waitForNavigation();
        await collectdata(page);
        browser.close();
    } catch (e){
        ERRORS.push('System exception occured. Please try again!')
    }

    return {
        data: ALL_DATA,
        errors: ERRORS,
        timeTaken: "",
        browserLoadTime: ""
    };
}

async function startBrowser(mode){
  if(!browserRunning){
    browser = await puppeteer.launch({
        headless: isHeadless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    browserRunning = true;
  }
  return browser;
}

async function executeStep(page, step, data){
  if(step.action == "ENTER_VALUE"){
    await page.click(step.selector);
    await page.keyboard.type(data[step.param_name]);
  }else if(step.action == "CLICK"){
    await page.click(step.selector);
  }
}

async function collectdata(page) {


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
