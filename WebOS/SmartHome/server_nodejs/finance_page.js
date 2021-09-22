const alert = require('alert');
const fs = require('fs');
const path = require('path');

//database comm file
const db_query = require('../db/db_single_request.js');
const node_db_comm = require('./db_comm.js');

//local model temp file
const local_auth = require("../models/local_auth.js");

function getTime(time_milisec) {
  let date_ob = new Date(time_milisec);
  var date = date_ob.getDate();
  var month = date_ob.getMonth() + 1;
  var year = date_ob.getFullYear();
  var hour = date_ob.getHours();
  var min = date_ob.getMinutes();
  list = [JSON.stringify(year),
          JSON.stringify(month),
          JSON.stringify(date),
          JSON.stringify(hour),
          JSON.stringify(min)];
  return list;
}

function make_time_format(list) {
  var year = list[0].trim(" ");
  var month = list[1].trim(" ");
  var date = list[2].trim(" ");
  var hour = list[3].trim(" ");
  var min = list[4].trim(" ");

  if (month.length == 1)
    month = "0" + month;

  if (date.length == 1)
    date = "0" + date;

  if (hour.length == 1)
    hour = "0" + hour;

  if (min.length == 1)
    min = "0" + min;

  var full_format = "" + year + "/" + month + "/" + date + ".\n" + hour + ":" + min;
  return full_format;
}

async function readQueryFile (file_directory) {
  var file = "";
  try {
    file = fs.readFileSync(path.join(__dirname, file_directory)).toString()
  } catch (err) {
    console.log(err);
  }
  return file;
}

/*
 * 0: device_id, 1:device_name, 2:owner_number, 3:private_use
 * 4:shared_user_number, 5:power_usage
 */
async function renderFinanceJSONFile() {
  var summary_data = [];
  var query_value = [local_auth.user_number];
  try {
    var string_query = await readQueryFile('../db/summarize_finance_data.sql');
  } catch(err) {
    console.log("File data error: " + err);
  }
  //Update query file to get user summary
  try {
    await db_query.db_request_data(string_query);
  } catch (err) {
    console.log("Update error: " + err);
  }

  if (string_query == null) {
    return;
  }

  //retrive file
  //SELECT * FROM "webOS_user" WHERE user_id = '1' ;
  var string_query2 = "SELECT *"
         + ' FROM "webOS_user"'
         + " WHERE user_id='1';";
  try {
    //0: user_name, 2: total_used_fuel, 4: total_used_elect
    //assumes only returns one row
    summary_data = await db_query.db_request_data(string_query2);
  } catch(err) {
    console.log("Request error: " + err);
  }

  let time_object = Date.now();
  var current_time_list = getTime(time_object);
  var current_time_formatted = make_time_format(current_time_list);

  //read car image links from db
  var renderForm = {
    current_time: current_time_formatted,
    total_fuel_used: summary_data[0][2],
    total_electricity_used: summary_data[0][4]
  };

  return renderForm;
}

//must be ordered by device id
async function get_devices_by_user(user) {
  var query = "SELECT * FROM webos_electronics_status WHERE device_id='"
              + user + "' ORDER BY device_id ASC;";
   var summary;
   try {
     summary = await db_query.db_request_data(query);
   } catch (err) {
     console.log("DB Table is empty: " + err);
     return;
   }
   return summary;
}

async function get_device_useage() {
  //get summary report data from webOS_user


  //if there are multiple users - divide by usages
  var query = "SELECT * FROM webos_electronics_status ORDER BY device_id ASC;";
   var summary;
   try {
     summary = await db_query.db_request_data(query);
   } catch (err) {
     console.log("DB Table is empty: " + err);
     return;
   }
   return summary;
}

//local_node_devices
module.exports = {
  renderFinanceJSONFile
};
