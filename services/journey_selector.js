const fs = require("fs");
//const JOURNEY_PATH = "../journeys/";
const JOURNEY_PATH = __dirname + "/../journeys/";
const MAPPING_PATH = "mappings/";
const JOURNEY_MAPPING_FILE_NAME = "journey_mapping.json";

async function journeySelector(journey_name){

  let journey_mappings_raw = fs.readFileSync(JOURNEY_PATH + JOURNEY_MAPPING_FILE_NAME);
  let journey_mapping = JSON.parse(journey_mappings_raw);

  if(journey_mapping[journey_name]){
    let journey_details_raw = fs.readFileSync(JOURNEY_PATH + MAPPING_PATH + journey_mapping[journey_name] + ".json");
    let journey_details = JSON.parse(journey_details_raw);
    return journey_details;
  }

  return "NOT_FOUND";
}

module.exports = journeySelector;
