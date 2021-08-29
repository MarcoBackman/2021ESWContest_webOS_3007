const path = require('path');
const fs = require('fs');
const request = require('request');
const fetch = require('node-fetch');

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

async function register_car_info(input_values, full_request_url, res) {
  var image_link = "";

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
     //check local image data - compare with DB file name
     
     //this will refresh a page
     res.render('../web_source/ejs/car_page', renderJSONFile());
  } else { //Write input data to DB
    //check car image on local file - compare with DB file name
    var valid = validate_image_file(file_name);

    //no image found
    if (valid == false) {
      //send query to DB
      var image_link = await get_car_imagelink(full_request_url, res);
      //download image from url
      car_image_download(image_link, file_name);
    }

    //post data to db from the link(including images)
    try {
      await insert_car_info(input_values, file_name, local_auth.name);
    } catch(err) {
      console.log("Car info insertion err on db request:" + err);
    }

    //then refresh page
    res.render('../web_source/ejs/car_page', renderJSONFile());
  }
}

async function insert_car_info(input_values, img_file_name, current_user) {
    /*
     * car_year
     * car_model
     * car_company
     * car_owner
     * car_name
     * car_num
     */
    var car_info = [input_values[0], input_values[1], input_values[2], input_values[4]];
    var query_lists = [car_info, input_values[3], input_values[5], img_file_name, current_user];
    //must provide all 5 critical elements to DB:
    //  car_num, car_owner, img_file_name, registered_user, car_info.
    var insert_query
     = 'INSERT INTO webOS_car(car_info, car_owner, car_num,' +
        'car_image ,registered_user) VALUES($1,$2,$3,$4,$5) RETURNING *;';
    try {
      var result = await db_query.db_insert(insert_query, query_lists);
    } catch(err) {
      console.log("Error on car info insertion" + err);
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

//this function cannot be async function - used for rendering ejs
async function renderJSONFile() {
  //run this as promise

  //empty car list means there is no matching car that user ownes
  var car_list = await node_db_comm.car_data_by_user("webOS_car", "car_owner",
    local_auth.name, "car_num");

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

  /*
   * 0 : car number
   * 1 : car owner
   * 2 : car image
   * 3 : registered user
   * 4 : detailed car info.
   */
  if (car_list[0] != null) {
    for(var i = 0; i < car_list.length; i++) {
      //store car_name into the array
      pushData(car_list[i], car_names, 4, 2);
      //store image file name to the array
      pushData(car_list[i], car_images, 2, -1);
      //store fuel usage to the array of each car

      //store car numbers into the array
      pushData(car_list[i], car_numbers, 0, -1);
      //returns a list of time sets {start, end} pair of a given car
      //[from,to]
      var time_sets = await get_car_schedule(car_list[i][0]);
      if (time_sets.length == 0)
        continue;
      schedule_by_car[car_numbers] = time_sets;
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

  if (month.length == 1) {
    month = "0" + month;
  }

  if (date.length == 1) {
    date = "0" + date;
  }

  if (hour.length == 1) {
    hour = "0" + hour;
  }

  if (min.length == 1) {
    min = "0" + min;
  }

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

function db_car_summary_date_validation(last_updated_time, user) {

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
