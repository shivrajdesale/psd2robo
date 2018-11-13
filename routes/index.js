var express = require('express');
var executeJourney = require('../services/executor');
var journeySelector = require('../services/journey_selector');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'PSD2 Robo' });
});

router.post('/execute', async function(req, res, next){
  let indexPage = req.body.indexPage,
  isHeadless = req.body.mode === 'Headless' ? true : false,
  data = {};
  data.username = req.body.userid;
  data.password = req.body.password;
  let journey = await journeySelector('LOGIN');
  let response = await executeJourney(journey, isHeadless, data);
  //let response = await executeJourney(isHeadless, indexPage, data);
  res.render('data', {
      title: 'PSD2 Robo' ,
      data: response.data,
      errors: response.errors,
      timeElapsed: response.timeTaken,
      browserLoadTime: response.browserLoadTime
    });
});

module.exports = router;
