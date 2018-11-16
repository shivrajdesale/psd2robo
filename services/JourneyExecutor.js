const puppeteer = require('puppeteer');
let journey = {};
let data_collection_scope = "";

const JOURNEY = {
    LOGIN_FIELD: 'input[id="ppm_login_username"]',
    PASSWORD_FIELD: 'input[id="ppm_login_password"]',
    LOGIN_BUTTON_FIELD: 'input[id="ppm_login_button"]',
    PAGINATION_INPUT_FIELD: 'table[id="portlet-table-timeadmin.timesheetBrowser"] div.ppm_gridcontent div input.ppm_field',
    NEXT_BUTTON_FIELD: 'button[id="nextPageButton"]',
    LOGOUT_FIELD: 'a#ppm_header_logout'
};

class JourneyExecutor {

    static async executeFromPool(browserInstance, data, journeyParam){
        let ALL_DATA = [];
        let ERRORS = [];
        journey = journeyParam;

        let browser = browserInstance.browser,
            page = browserInstance.page;

        let startTime = new Date();
        try{
            if(journey.action_sequence){
              for(const step of journey.action_sequence){
                await this.executeStep(page, step, data);
              }
            }

            await page.waitForNavigation();
            ALL_DATA = await this.collectdata(page);

            // const text = await page.evaluate(() => document.querySelector('table[id="portlet-table-timeadmin.timesheetBrowser"] div.ppm_gridcontent div input.ppm_field').getAttribute('aria-label'));
            //
            // let numberOfPages, temp = text.split('of ');
            // if(temp && temp.length > 0){
            //     numberOfPages = parseInt(temp[1], 10);
            // }
            // if(numberOfPages){
            //     for(let i= 1; i < numberOfPages; i++){
            //         try {
            //             await page.click(JOURNEY.NEXT_BUTTON_FIELD);
            //             await page.waitForNavigation();
            //             await this.updatePageDetails(page, ALL_DATA);
            //         } catch(e) {
            //             ERRORS.push('Error in step' + i);
            //         }
            //
            //     }
            // }
            await page.click(JOURNEY.LOGOUT_FIELD);
        } catch (e){
            ERRORS = await this.collecterror(page);
            //ERRORS.push('System exception occured. Please try again!')
        }

        let endTime = new Date();
        return {
            data: ALL_DATA,
            errors: ERRORS,
            timeTaken: parseInt((endTime.getTime() - startTime.getTime()), 10)/1000,
        };
    }

    static async collecterror(page){
      let errors = [];
     if(journey.error_collection.elements){
       try{
         let item = {};
         for(let selector of journey.error_collection.elements){
           let fetchedValue = "";
           if(selector.retriever && selector.retriever.attribute){
             let element = await page.$(selector.selector);
             if(element)
               item[selector.name] = await element.getProperty(selector.retriever.attribute);
           }else{
             fetchedValue = await page.$eval(selector.selector, n => n.innerText);
           }
           item[selector.name] = (fetchedValue && selector.retriever) ? this.getParamValue(fetchedValue,selector.retriever) : fetchedValue.trim();
         }
         errors.push(item);
       }catch(e){

       }
      }
      return errors;
    }

    static getParamValue(value, retriever){
      if(retriever){
        if(retriever.pre_val){
          value = value.split(retriever.pre_val);
          value = ((value.length > 1) && value[1]) ? value[1]:value[0];
        }
        if(retriever.post_val){
          value = value.split(retriever.post_val)[0];
        }
      }
      return value.trim();
    }

    static async collectdata(page) {
      let data = [];
      data_collection_scope = await page.$(journey.data_collection.scope);

      let currentPageData = await this.collectCurrentPageData(page);
      data = data.concat(currentPageData);
      //show alll temp code
      // let showAllButton = await page.$$('.ppm_filter_section .ppm_button_bar button');
      // if(showAllButton && showAllButton.length > 1){
      //   showAllButton = showAllButton[1];
      //   await showAllButton.click();
      //   await page.waitForNavigation();
      // }
      //

      // if(journey.data_collection.pagination){
      //   const pageCount = await this.getPageCount(page);
      //   if(pageCount > 1){
      //     const nextButton = await this.rselector(journey.data_collection.pagination.action);
      //     if(nextButton){
      //       await nextButton.click();
      //       await page.waitForNavigation();
      //       await collectCurrentPageData(page);
      //     }
      //   }
      // }

      return data;
    }

    static async executeStep(page, step, data){
      if(step.action == "ENTER_VALUE"){
        await page.click(step.selector);
        await page.keyboard.type(data[step.param_name]);
      }else if(step.action == "CLICK"){
        await page.click(step.selector);
      }
    }

    static async updatePageDetails(page, dataArr) {
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
                    dataArr.push({name, startDate, status, pending});
            }
        }
    }

    static async collectCurrentPageData(page){
      let collected_data = [];
      if(journey.data_collection.elements){
        let parent = journey.data_collection.parent ? await this.rselector(page,journey.data_collection.parent) : data_collection_scope;
        if(! (parent instanceof Array ) ){
          parent = [parent];
        }

        for(let element of parent){
          var item = {};
          for(let selector of journey.data_collection.elements){
            item[selector.name] = await element.$eval(selector.selector, n => n.innerText.trim());
          }
          collected_data.push(item);
        }
      }
      return collected_data;
    }

    static async rselector(page,element){
      let scope = null;
      if(element.parent){
        scope = await this.rselector(page, element.parent);
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

static async getPageCount(page){
  let pageCount = 1;
  if(journey.data_collection.pagination.page_count){
    const page_count = journey.data_collection.pagination.page_count;
    const parent = page_count.parent ? await this.rselector(page,page_count.parent):data_collection_scope;
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
}

module.exports = JourneyExecutor;
