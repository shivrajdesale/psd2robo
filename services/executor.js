const puppeteer = require('puppeteer');
var journeySelector = require('./journey_selector');
var browser = "";
let data_collection_scope = "";
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
    data_collection_scope = await page.$(journey.data_collection.scope);

    await collectCurrentPageData(page);

    //show alll temp code
    // let showAllButton = await page.$$('.ppm_filter_section .ppm_button_bar button');
    // if(showAllButton && showAllButton.length > 1){
    //   showAllButton = showAllButton[1];
    //   await showAllButton.click();
    //   await page.waitForNavigation();
    // }
    //

    if(journey.data_collection.pagination){
      const pageCount = await getPageCount(page);
      if(pageCount > 1){
        const nextButton = await rselector(journey.data_collection.pagination.action);
        if(nextButton){
          await nextButton.click();
          await page.waitForNavigation();
          await collectCurrentPageData(page);
        }
      }
    }

    // let items = await page.evaluate(() => document.querySelectorAll('table[id="portlet-table-timeadmin.timesheetBrowser"] table tbody tr'));
    // if(items && Object.keys(items).length){
    //     for(let i = 1; i <= Object.keys(items).length; i++){
    //         let baseString = 'table[id="portlet-table-timeadmin.timesheetBrowser"] table tbody tr:nth-child('+i+')';
    //         let name = await page.evaluate((sel) => {
    //                 return document.querySelector(sel +' td[column="8"]').innerText
    //             }, baseString),
    //             startDate = await page.evaluate((sel) => document.querySelector(sel +'  td[column="10"]').innerText, baseString),
    //             status = await page.evaluate((sel) => document.querySelector(sel +'  td[column="11"]').innerText, baseString),
    //             pending = await page.evaluate((sel) => document.querySelector(sel +'  td[column="14"]').innerText, baseString);
    //         ALL_DATA.push({name, startDate, status, pending});
    //     }
    // }
}

async function rselector(page,element){
  let scope = null;
  if(element.parent){
    scope = await rselector(page, element.parent);
  }else{
    scope = data_collection_scope;
  }
  if(element.type == "array"){
    scope = await scope.$$(element.selector);
  }else{
    scope = await scope.$(element.selector);
  }
  return scope;
}

async function getPageCount(page){
  let pageCount = 1;
  if(journey.data_collection.pagination.page_count){
    const page_count = journey.data_collection.pagination.page_count;
    const parent = page_count.parent ? await rselector(page,page_count.parent):data_collection_scope;
    let retriever = page_count.retriever && page_count.retriever.attribute ? "attribute" : "innerText";
    if(retriever == "attribute"){
      pageCount = await parent.$eval(page_count.selector,n > n.getAttribute(page_count.retriever.attribute).trim());
    }else{
      pageCount = await parent.$eval(page_count.selector,n > n.innerText.trim());
    }
    if(page_count.retriever){
      if(page_count.retriever.pre_val){
        let preCount = pageCount.split(page_count.retriever.pre_val);
        pageCount = preCount.length > 1 ? preCount[1]:preCount[0];
      }
      if(page_count.retriever.post_val){
        pageCount = pageCount.split(page_count.retriever.post_val)[0];
      }
    }
  }
  return pageCount;
}

async function collectCurrentPageData(page){
  if(journey.data_collection.elements){
    let parent = journey.data_collection.parent ? await rselector(page,journey.data_collection.parent) : data_collection_scope;
    if(! (parent instanceof Array ) ){
      parent = [parent];
    }

    for(let element of parent){
      var item = {};
      for(let selector of journey.data_collection.elements){
        item[selector.name] = await element.$eval(selector.selector, n => n.innerText.trim());
      }
      ALL_DATA.push(item);
    }
  }
}

module.exports = executeJourney;
