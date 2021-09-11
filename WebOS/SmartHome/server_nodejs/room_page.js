const alert = require('alert');

//database comm file
const db_query = require('../db/db_single_request.js');
const node_db_comm = require('./db_comm.js');

//local model temp file
const local_auth = require("../models/local_auth.js");

function pushData(element, list_to_push, outer_index, inner_index) {
  if (inner_index == -1) {
    list_to_push.push(element[outer_index]);
  } else {
    list_to_push.push(element[outer_index][inner_index]);
  }
  return list_to_push;
}

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

/*
 * 0: device_id, 1:device_name, 2:owner_number, 3:private_use
 * 4:shared_user_number, 5:power_usage
 */
async function renderRoomJSONFile() {
  //render user's registered electronics
  device_lists_with_info = [];
  device_status = []; //save device status by device id

  try {
    device_lists_with_info = await get_device_lists(local_auth.user_number);
  } catch(err) {
    console.log("Getting device lists from db failed: " + err);
  }

  try {
    device_status = await get_device_status(local_auth.user_number);
  } catch(err) {
    console.log("Getting device lists from db failed: " + err);
  }


  let time_object = Date.now();
  var current_time_list = getTime(time_object);
  var current_time_formatted = make_time_format(current_time_list);

  console.log("Device Info: " + device_lists_with_info);
  console.log("Device Info: " + device_status);

  //read car image links from db
  var renderForm = {
    current_time: current_time_formatted,
    device_info: device_lists_with_info,
    device_status: device_status
  };
  return renderForm;
}

//must be ordered by device id
async function get_device_lists(user) {
  var query = "SELECT * FROM webos_electronics WHERE owner_number='"
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

async function get_device_status() {
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
  renderRoomJSONFile
};
