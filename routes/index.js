var express = require('express');
var executeJourney = require('../services/clarity');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'PSD2 Robo' });
});

router.post('/execute', async function(req, res, next){
  let indexPage = req.body.indexPage, 
  isHeadless = req.body.mode === 'Headless' ? true : false,
  credentials = {};
  credentials.username = req.body.userid;
  credentials.password = req.body.password;
  let response = await executeJourney(isHeadless, indexPage, credentials);
  res.render('data', { title: 'PSD2 Robo' , data: response.data, timeElapsed: response.timeTaken});
});

module.exports = router;
