const puppeteer = require('puppeteer');
const browser = "";
const runningBrowser = false;

exports.getInstance = async function(mode){
  if(!runningBrowser){
    browser = await puppeteer.launch({
        headless: mode,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    runningBrowser = true;
  }
  return browser;
}

exports.close = async function(){
  if(runningBrowser){
    browser.close();
    runningBrowser = false;
  }
}
