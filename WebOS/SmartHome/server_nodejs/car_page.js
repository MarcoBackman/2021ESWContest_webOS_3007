const path = require('path');
const fs = require('fs');
const request = require('request');
const fetch = require('node-fetch');
const alert = require('alert');

//database comm file
const db_query = require('../db/db_single_request.js');
const node_db_comm = require('./db_comm.js');

//local model temp file
const local_auth = require("../models/local_auth.js");

/*
 ***********************************************
 *                  Car register               *
 ***********************************************
 */

 /*
 * input_values
 * 0: car_year, 1: car_model, 2: car_company, 3: car_owner
 * 4: car_name, 5: car_num
 */
async function register_car_info(input_values, res) {
  var image_link = "";
  //if the user enters other user's name it must be granted.
  // Otherwise, skip the requst
  //for now it will not accept the registeration from different users
  if (input_values[3] != local_auth.user_number) { //use compare with user_number not names
    alert("허가되지 않은 차량 등록입니다!");
    res.render('../web_source/ejs/car_page', await renderJSONFile());
    return;
  }

  //validate duplication car (by car number)
  var exists = false;
  try {
    exists = await node_db_comm.check_data("webos_car",
                                           "car_num",
                                           input_values[5]);
  } catch(err) {
    console.log("Car data check on db error: " + err);
    return;
  }
  //make file car_name
  var file_name = output_file_name(input_values);

  //Alert user if the car info is already registered.
  if (exists) {
    console.log("File exist");
    //check local image data - compare with DB file name

    //this will refresh a page
    res.render('../web_source/ejs/car_page', await renderJSONFile());
  } else { //Write input data to DB
    //check car image on local file - compare with DB file name
    console.log("File does not exist");
    var valid = validate_image_file(file_name);

    //no image found
    if (valid == false) {
      var full_request_url
        = await make_api_request_form(input_values);

      var image_link = await get_car_imagelink(full_request_url, res);
      //download image from url
      await car_image_download(image_link, file_name);
    }

    //post data to db from the link(including images)
    try {
      await insert_car_info(input_values, file_name, local_auth.user_number);
    } catch(err) {
      console.log("Car info insertion err on db request:" + err);
    }

    //then refresh page
    res.render('../web_source/ejs/car_page', await renderJSONFile());
  }
}

// input value info:
// 0: car_year, 1: car_model, 2: car_company, 3: car_owner_number,
// 4: car_name, 5: car_num
async function insert_car_info(input_values, img_file_name, current_user) {
    var car_info = [input_values[0],
                    input_values[1],
                    input_values[2],
                    input_values[4]];

    var reg_user = [current_user];

    var query_lists = [car_info,
                       input_values[3],
                       input_values[5],
                       img_file_name,
                       reg_user];

    var insert_query
     = 'INSERT INTO webOS_car(car_info, car_owner_number, car_num,' +
        'car_image ,registered_user_list) VALUES($1,$2,$3,$4,$5) RETURNING *;';
    try {
      var result = await db_query.db_insert(insert_query, query_lists);
    } catch(err) {
      console.log("Error on car info insertion" + err);
      return ;
    }
    return result;
}

/*
 ***********************************************
 *                Render EJS JSON              *
 ***********************************************
 */

function pushData(element, list_to_push, outer_index, inner_index) {
  if (inner_index == -1) {
    list_to_push.push(element[outer_index]);
  } else {
    list_to_push.push(element[outer_index][inner_index]);
  }
  return list_to_push;
}

async function get_summary_data() {

}

/*
 * car_list
 * 0 : car number
 * 1 : car image
 * 2 : car info
 * 3 : car owner number
 * 4 : registered user
 */
async function renderJSONFile() {

  //get car info by registered user
  var car_list
    = await node_db_comm.car_data_by_user("webOS_car",
                                          "registered_user_list",
                                          local_auth.user_number,
                                          "car_num");

  //render user's registered car info into array
  var car_names = [];
  var car_images = [];
  var car_numbers = [];
  var schedule_by_car = {};
  var fuel_remaining = {};
  var total_fuel_used = {};
  var total_fuel_refilled = {};
  var total_hours_used = {};

  let time_object = Date.now();
  var current_time_list = getTime(time_object);
  var current_time_formatted = make_time_format(current_time_list);

  if (car_list[0] != null) {
    for(var i = 0; i < car_list.length; i++) {
      //store car_name into the array
      pushData(car_list[i], car_names, 2, 3);
      //store image file name to the array
      pushData(car_list[i], car_images, 1, -1);
      //render fuel data
      summarize_fuel_data(car_list[i][0]);
      //store car numbers into the array
      pushData(car_list[i], car_numbers, 0, -1);
      //store fuel usage to the array of each car
      var summary
       = await get_summary_by_car_user(local_auth.user_number, car_list[i][0]);
      console.log(summary);
      if (summary[0] == null) {
        console.log("Summary of " + car_list[i][0] + " car is empty");
      } else if (summary[0].length == 0) {
        console.log("Summary of " + car_list[i][0] + " car is empty");
      } else {
        //save by car number
        total_fuel_used[car_list[i][0]] = summary[0][0];
        total_fuel_refilled[car_list[i][0]] = summary[0][5];
        fuel_remaining[car_list[i][0]] = summary[0][6];
      }
      //returns a list of time sets {start, end} pair of a given car
      //[from,to]
      var time_sets = await get_car_schedule(car_list[i][0]);
      if (time_sets.length == 0)
        continue;
      schedule_by_car[car_list[i][0]] = time_sets;
    }
  }

  //read car image links from db
  var renderForm = {
    car_names: car_names,
    car_numbers: car_numbers,
    car_images: car_images,
    car_schedule: schedule_by_car,        //{"car_num1": time_sets[start[],end[]],
                                          //    "car_num2":time_sets[start[], ...}
    fuel_remaining: fuel_remaining,       //{"car_num1": remaining_ruel, ...}
    fuel_used: total_fuel_used,           //{"car_num1": total_used_fuel, ...}
    refilled: total_fuel_refilled,        //{"car_num1": total_fuel_refilled, ...}
    hours_used: total_hours_used,         //{"car_num1": total_hours_used, ...}
    current_time: current_time_formatted
  };
  return renderForm;
}

/*
 ***********************************************
 *                  Car Schedule               *
 ***********************************************
 */

 async function get_car_schedule(car_number) {
   var car_schedule_from = [];
   var car_schedule_to = [];
   var result =
    await node_db_comm.select_by_data("car_schedule", "car_number", car_number);
   if (result == null || result.length == 0) {
     console.log("No matching data or empty data.");
     return [];
   }

   for (var i = 0; i < result.length; i++ ) {
       car_schedule_from.push(result[i][1]);
       car_schedule_to.push(result[i][2]);
   }

   //[from[], to[]]
   return [car_schedule_from, car_schedule_to];

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

  var full_format = "" + year + month + date + hour + min;
  return full_format;
}

//critical issue! -> must select car_name by index of ejs iteration order.
//Modify this issue soon as possible.
async function sendDataFormat(req, res) {
   var selected_car = req.body.reserve_car;  //car name
   var car_name_label = "car_number_" + selected_car;
   var car_number = req.body[car_name_label];     //car number
   var user_name = local_auth.name;          //user name
   var time_from_list = [req.body.year_from, //start time
                         req.body.month_from,
                         req.body.date_from,
                         req.body.hour_from,
                         req.body.min_from];

   var time_to_list = [req.body.year_to,     //end time
                       req.body.month_to,
                       req.body.date_to,
                       req.body.hour_to,
                       req.body.min_to];

   var time_from = make_time_format(time_from_list);
   var time_to = make_time_format(time_to_list);

   //get car info from DB - select row by owner_name
   //This will raise data accuracy problem
   //  - what if there are more than two cars with the same name?
   //    How will you set the order? Order might be irregular with the other data
   //  - Change db column type(registered_user) to array to store multiple users
   var result;
   if (car_number == null || selected_car == null) {
      console.log("Invalid car number");
      return;
   } else {
     console.log("Car number to insert: " + car_number);
   }
   try {
     result = await node_db_comm.get_column_data("webOS_car", "car_num",
      car_number, "car_info");
   } catch(err) {
     console.log("Car info get from db error: " + err);
     return;
   }
   if (result == null) {
     console.log("No returned result");
     return;
   }

   var input_array = [car_number, user_name, time_from, time_to, result[0]];

   //send data set to the server
   try {
     node_db_comm.insert_car_schedule(input_array);
   } catch(err) {
     console.log("Car schedule insert error: " + err);
   }
}

/*
 ***********************************************
 *               CAR API request               *
 ***********************************************
 */

function make_api_request_form(input_values) {
  const car_img_api = require("../db/config/car_api_conf.json");
  var full_request_url = "";
  Object.entries(car_img_api).forEach(([keyword, value]) => {
    if (keyword == "_api_reference") {
    } else if (keyword == "url") {
      full_request_url += value ;
    } else if (keyword == "year") {
      full_request_url += keyword + "=" + input_values[0] + "&";
    } else if (keyword == "model") {
      full_request_url += keyword + "=" + input_values[1] + "&";
    } else if (keyword == "make") {
      full_request_url += keyword + "=" + input_values[2] + "&";
    } else {
      full_request_url += keyword + "=" + value +"&";
    }
  });
  return full_request_url;
}

async function get_car_imagelink(full_request_url, res) {
  let settings = { method: "Get" };
  console.log("Full request url: " + full_request_url);
  var response = await fetch(full_request_url, settings);
  var json_response = await response.json();
  var image_link = json_response.images[0].link;
  return image_link;
}


/*
 ***********************************************
 *             CAR file validation             *
 ***********************************************
 */

function output_file_name(input_values) {
  //set file_name - company_model_year.png
  return "" + input_values[2] + "_" + input_values[1]
            + "_" + input_values[0] + ".png";
}

function car_image_download(image_link, file_name) {
  //execute image download
  var download = function(url, name, callback) {
    request.head(url, function(err, head_res, body){
      console.log('content-type:', head_res.headers['content-type']);
      console.log('content-length:', head_res.headers['content-length']);
      let pathToFile = path.join(__dirname,
         "../web_source/src/car_img", name);
      request(url).pipe(fs.createWriteStream(pathToFile)).on('close', callback);
    });
  };

  download(image_link, file_name, function() {
    console.log('Image download complete.');
  });
}

function validate_image_file(file_name) {
  const path = '../web_source/src/car_img/' + file_name;
  try {
    if (fs.existsSync(path)) {
      return true;
    }
  } catch(err) {
    console.error(err);
    return false;
  }
  return false;
}


/*
 ***********************************************
 *             CAR fuel validation             *
 ***********************************************
 */

async function get_summary_by_car_user(user, car_number) {
  var query = "SELECT * FROM car_usage_summary WHERE car_number='"
   + car_number + "' AND user_number='" + user + "';";
   var summary;
   try {
     summary = await db_query.db_request_data(query);
   } catch (err) {
     console.log("DB Table is empty: " + err);
     return;
   }
   return summary;

}

async function get_last_time_summary_data(user, car_number) {
  //get the highest(recent) time index
  var query = "SELECT MAX(service_end_time FROM car_usage_summary)"
   + "WHERE car_number='" + car_number
  + "' AND user_name='" + user + "';";
  //must have only single element in the array
  var car_usage_log;
  try {
    car_usage_log = await db_query.db_request_data(car_log_query);
  } catch (err) {
    console.log("DB Table is empty: " + err);
    return -1;
  }

  if (car_usage_log == null) {
    return -1;
  }

  if (car_usage_log[0].length == 0) {
    return -1;
  }

  return car_usage_log[0];
}

//gets index of car summary report based on the given inputs
//decides whether table is empty or not
async function lookup_car_summary_report(car_number) {
  var result = -1;
  //retrieve car use log(car_use_log by user)
  // based on the lastly modified date(car_usage_summary by user)
  var car_log_query_check_null = "SELECT MAX(last_update_time) IS null FROM car_usage_summary" +
                                 " WHERE (car_number ='" + car_number +
                                 "' AND user_number ='" + local_auth.user_number + "');";
  var car_log_query = "SELECT MAX(last_update_time) FROM car_usage_summary" +
                      " WHERE (car_number ='" + car_number +
                      "' AND user_number ='" + local_auth.user_number + "');";
  try{
    result = await db_query.db_request_data(car_log_query_check_null);
  } catch (err) {
    console.log("ACCESSING DATA REJECTED " + err);
    return -2;
  }

  //if there is no returned data - no data
  if (result == 'true') {
    return -1;
  } else {
    try{
      result = await db_query.db_request_data(car_log_query);
    } catch (err) {
      console.log("ACCESSING DATA REJECTED " + err);
      return -2;
    }
  }

  //return timeline
  return result[0];
}

/*
 *   -1 : error index
 *    0 : no update index
 *    1 : update index
 */
//check if the update is needed - consider summary time may be empty
async function update_required(car_number, summary_time) {
  var car_log_query
   = "SELECT MAX(service_end_time) FROM car_usage_log WHERE (car_number='" +
     car_number + "' AND user_number='" + local_auth.user_number + "');";
  var result;

  try {
    result = await db_query.db_request_data(car_log_query);
  } catch (err) {
    console.log("REQUEST ERROR: " + err);
    return -1;
  }

  //if log has no data at all
  if (result.length == 0) {
    return 0;
  }

  //if given time and last updated time is the same
  if (result[0] == summary_time[0]) {
    console.log("NO UPDATE NEEDED");
    return 0;
  }

  console.log("REQUIRES UPDATE");
  //requires update
  return 1;
}

async function get_log_data(car_number, last_end_time) {
  //get every array by the time larger than the starting_time
  var car_log_query = "SELECT * FROM car_usage_log WHERE service_end_time" +
                      " > '" + last_end_time +"' AND car_number='" + car_number +
                      "' AND user_number='" + local_auth.user_number +
                      "' ORDER BY service_end_time ASC;";
  //Log index:
  //  0: fuel_used, 1: service_start_time, 2: service_end_time,
  //  3: fuel_actual_level, 4: fuel_refilled, 5: car_number,
  //  6: user_number.
  try {
    var log_list = await db_query.db_request_data(car_log_query);
    if (log_list.length == 0) {
      console.log("Nothing to update");
      return -1;
    }
    return log_list;
  } catch (err) {
    console.log("ERROR ON CAR_LOG REQEUST " + err);
    return -1;
  }
}

function sum_up_data(log_list) {
  var data_set = [];
  var used_fuel = 0.0;
  var last_time = 0;
  var fuel_level = 0;
  var refilled_fuel = 0;
  var total_time = 0;
  for (var i = 0 ; i < log_list.length; i++) {
    used_fuel += log_list[i][0];
    last_time = log_list[i][2];
    fuel_level = log_list[i][3];
    refilled_fuel += log_list[i][4];
  }

  data_set.push(used_fuel);
  data_set.push(total_time);
  data_set.push(last_time);
  data_set.push(refilled_fuel);
  data_set.push(fuel_level);

  return data_set;
}

async function insert_new_summary_data(car_number) {
  var log_list = await get_log_data(car_number, 0);
  if (log_list == -1) {
    return;
  }

  if (log_list.length == 0) {
    return;
  }

  var data_set = sum_up_data(log_list);
  console.log("INSERTED DATA SET: " + data_set);
  //Summary index:
  //  0: total_fuel_used, 1: total_hours_used, 2: car_number,
  //  3: last_update_time, 4:user_number
  var insert_query = "INSERT INTO car_usage_summary(" +
                     "total_fuel_used, total_hours_used, last_update_time," +
                     "refilled_fuel, fuel_level, user_number, car_number) " +
                     "VALUES (" + data_set[0] + ", " + data_set[1] + ", " +
                      data_set[2] + ", " + data_set[3] + ", " + data_set[4] +
                      ", " + local_auth.user_number + ", " + car_number + ");";
  try {
    await db_query.db_request(insert_query);
  } catch (err) {
    console.log("Error on summary insertion: " + err);
  }
}

async function update_summary_data(car_number, last_end_time) {
  try {
    var log_list = await get_log_data(car_number, last_end_time);
  } catch (err) {
    console.log("LOG LIST ERROR: " + log_list);
    return;
  }
  if (log_list == -1) {
    return;
  }

  var data_set = sum_up_data(log_list);
  //Summary index:
  //  0: total_fuel_used, 1: total_hours_used, 2: car_number,
  //  3: last_update_time, 4:user_number
  var update_query = "UPDATE car_usage_summary " +
                     "SET last_update_time='" + data_set[2] +
                     "' total_fuel_used='" + data_set[0] +
                     "' total_hours_used='" + data_set[1] +
                     "' refilled_fuel='" + data_set[3] +
                     "' fuel_level='" + data_set[4] +
                     "' WHERE user_number='" + local_auth.user_number +
                     " AND car_number='" + car_number + "';";
   try {
     await db_query.db_request(update_query);
   } catch (err) {
     console.log("Error on summary update");
   }
}

async function summarize_fuel_data(car_number) {

  var summary_last_modified_time
   = await lookup_car_summary_report(car_number);
  console.log(summary_last_modified_time);
  if (summary_last_modified_time == -2) { //error skip this work
    return;
  } else if (summary_last_modified_time == -1) { //empty summary table
    //add up everything on the log
    await insert_new_summary_data(car_number);
  } else {
    var update_index =
      await update_required(car_number, summary_last_modified_time);

    if (update_index == 1) {
      //update from the specified timeline
      await update_summary_data(car_number, summary_last_modified_time);
    } else {
      console.log("Update not required");
    }

  }
}

//local_node_car
module.exports = {
  renderJSONFile,
  make_time_format,
  make_api_request_form,
  validate_image_file,
  register_car_info,
  sendDataFormat
};
