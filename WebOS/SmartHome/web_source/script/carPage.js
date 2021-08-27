function datesInMonth (month, year) {
    return new Date(year, month, 0).getDate();
}

function isValidDate(year, month, date) {
  if (year == "-" || month == "-" || date == "-") {
    return false;
  }
  return true;
}

function isValidTime(hour, min) {
  if (hour == "-" || min == "-") {
    return false;
  }
  return true;
}

//ex) 20211129
function toDateFormInt(year, month, date) {
  console.log("Year: " + year + ", Month: " + month + ", Date: " + date);
  var full_date = "";
  if (month.length == 1) {
    full_date += + year + "0" + month;
  } else {
    full_date += + year + month;
  }
  if (date.length == 1) {
    full_date += "0" + date;
  } else {
    full_date += date;
  }
  console.log("Date format: " + full_date);
  var full_date_int = parseInt(full_date, 10);
  return full_date_int;
}

//ex) 2244
function toTimeFormInt(hour, min) {
    console.log("Hour: " + hour + ", Min: " + min);
    var full_time = "";
    if (hour.length == 1) {
      full_time += "0" + hour;
    } else {
      full_time += "" + hour;
    }

    if (min.length == 1) {
      full_time += "0" + min;
    } else {
      full_time += "" + min;
    }
    console.log("Time format: " + full_time);
    var full_time_int = parseInt(full_time, 10);
    return full_time_int;
}

//larger value on the left hand will return true
//larger value on the right hand will return false
function isLarger(compare_a, compare_b) {
  if (compare_a > compare_b)
    return 1;
  else if (compare_a == compare_b)
    return 0;
  else
    return -1;
}

function setOption (target) {
  target = document.createElement("option");
  target.value = "value";
  target.textContent = "text to be displayed";
  select.appendChild(target);
}

function validateInputForm() {
  var input_year
   = document.getElementById("car_year").value.trim().toUpperCase();
  var input_model
   = document.getElementById("car_model").value.trim().toUpperCase();
  var input_comp
   = document.getElementById("car_company").value.trim().toUpperCase();
  var input_owner
   = document.getElementById("car_owner").value.trim().toUpperCase();
  var input_name
   = document.getElementById("car_name").value.trim().toUpperCase();
  var input_num
   = document.getElementById("car_num").value.trim().toUpperCase();

  if (input_year == "" || input_model == "" || input_comp == ""
   || input_owner == "" || input_name == "" || input_num == "") {
    console.log("invalid input");
    return false;
    return false;
  } else if (input_model == null || input_comp == null || input_model == null
          || input_owner == null || input_name == null || input_num == null) {
    return false;
  }
  return true;
}

function executeInfoForm() {
  var result = validateInputForm();
  if (result) {
    console.log("executing...");
    var element = document.getElementById("car_info_form");
    element.submit();
    return false;
  } else {
    alert("Fill every field");
    return false;
  }
}

function removeOptions(element) {
   var i, length = element.options.length - 1;
   for(i = length; i >= 0; i--) {
      element.remove(i);
   }
}

function createBlankOption() {
  blankOption = document.createElement("option");
  blankOption.value = "-";
  blankOption.textContent = "-";
  return blankOption;
}

function clearImage() {
  var img_section = document.getElementsByClassName("car_names");
  var car_numbers = document.getElementsByClassName("car_number");
  for (var i = 0; i < img_section.length; i++) {
    img_section[i].style.display="none";
    car_numbers[i].style.display="none";
  }
}

function currentDateTime() {
  var currentdate = new Date();
  var year    = currentdate.getFullYear();
  var month   = currentdate.getMonth()+1;
  var day     = currentdate.getDate();
  var hour    = currentdate.getHours();
  var minute  = currentdate.getMinutes();
  if(month.toString().length == 1) {
       month = '0'+month;
  }
  if(day.toString().length == 1) {
       day = '0'+day;
  }
  if(hour.toString().length == 1) {
       hour = '0'+hour;
  }
  if(minute.toString().length == 1) {
       minute = '0'+minute;
  }
  var dateTime = "" + year + month + day + hour + minute;
  return dateTime;
}

/*
 ***************************************
 *           On load function          *
 ***************************************
 */
window.onload = function() {
  currentDateTime();
  //---------------car info submission section--------------

  var car_info_form = document.getElementById("car_info_form");
  if (car_info_form.addEventListener) {
      car_info_form.addEventListener("submit", (event) => {
      var result = executeInfoForm(); //function duplication! need refactor
      if (result == false) {
        event.preventDefault();
      }
    });
  } else if(car_info_form.attachEvent) {
      car_info_form.attachEvent("onsubmit", (event) => {
      var result = executeInfoForm(); //function duplication! need refactor
      if (result == false) {
        event.preventDefault();
      }
    });
  }


  //---------------car calendar section--------------
  //change and load calendar on car selection


  //---------------car selection section--------------

  //consider putting car number on the next.
  var selected_car = document.getElementById("reserve_car");
  var car_img;
  selected_car.addEventListener("change", function() {
    clearImage();
    if (selected_car.value != "-") {
      car_img = document.getElementById(selected_car.value);
      car_nums = document.getElementById(selected_car.value + "_num");
      //show selected car image
      car_nums.style.display="block";
      car_img.style.display="block";
    } else {
      car_nums.style.display="none";
      car_img.style.display="none";
    }
  });


  //---------------schedule section--------------

  var year_f_select = document.getElementById("year_from");
  var month_f_select = document.getElementById("month_from");
  var year_t_select = document.getElementById("year_to");
  var month_t_select = document.getElementById("month_to");
  var date_f_select = document.getElementById("date_from");
  var date_t_select = document.getElementById("date_to");
  var hour_f_select = document.getElementById("hour_from");
  var hour_t_select = document.getElementById("hour_to");
  var min_f_select = document.getElementById("min_from");
  var min_t_select = document.getElementById("min_to");

  //if year is changed then reset month
  year_f_select.addEventListener("change", function() {
    month_f_select.value = "-";
    month_f_select.text = "-";
    date_f_select.value = "-";
    date_f_select.text = "-";
  });

  //if month is changed then check if the year is selected
  month_f_select.addEventListener("change", function() {
      if(month_f_select != "-" && year_f_select != "-")
      {
          var month_int = parseInt(month_f_select.value, 10);
          var year_int = parseInt(year_f_select.value, 10);
          var dates = datesInMonth(month_int, year_int);
          var select = document.getElementById("date_from");
          removeOptions(select);
          select.appendChild(createBlankOption());
          for (var date = 1; date < dates + 1; date++) {
            opt = document.createElement("option");
            opt.value = date;
            opt.textContent = date;
            select.appendChild(opt);
          }
      }
  });

  //if year is changed then reset month
  year_t_select.addEventListener("change", function() {
    month_t_select.value = "-";
    month_t_select.text = "-";
    date_t_select.value = "-";
    date_t_select.text = "-";
  });

  //if month is changed then check if the year is selected
  month_t_select.addEventListener("change", function() {
    if(month_t_select != "-" && year_t_select != "-")
    {
      var month_int = parseInt(month_t_select.value, 10);
      var year_int = parseInt(year_t_select.value, 10);
      var dates = datesInMonth(month_int, year_int);
        var select = document.getElementById("date_to");
        removeOptions(select);
        select.appendChild(createBlankOption());
        for (var date = 1; date < dates + 1; date++) {
          opt = document.createElement("option");
          opt.value = date;
          opt.textContent = date;
          select.appendChild(opt);
        }
    }
  });

  //Prompt error if selected end time is larger than the starting time.
  document.getElementById("reserve_btn").onclick = function() { //when submittion button is pressed
    var year_f_val = year_f_select.value;
    var month_f_val =  month_f_select.value;
    var date_f_val = date_f_select.value;
    var year_t_val = year_t_select.value;
    var month_t_val =  month_t_select.value;
    var date_t_val = date_t_select.value;
    var hour_f_val = hour_f_select.value;
    var minute_f_val = min_f_select.value;
    var hour_t_val = hour_t_select.value;
    var minute_t_val = min_t_select.value;
    if (isValidDate(year_f_val, month_f_val, date_f_val)
     && isValidDate(year_t_val, month_t_val, date_t_val)
     && isValidTime(hour_f_val, minute_f_val)
     && isValidTime(hour_t_val, minute_t_val)) {
     //returns integer values
     var from_full_date = toDateFormInt(year_f_val, month_f_val, date_f_val);
     var to_full_date = toDateFormInt(year_t_val, month_t_val, date_t_val);
     var comapre_res = isLarger(to_full_date, from_full_date);
      if (comapre_res == 1) { //normal date: pass
        console.log("pass");
      } else if (comapre_res == 0) { //same date: compare time
        var from_full_time = toTimeFormInt(hour_f_val, minute_f_val);
        var to_full_time = toTimeFormInt(hour_t_val, minute_t_val);
        if (isLarger(to_full_time, from_full_time) != 1) {
          alert("Date format error!");
          event.preventDefault();
        } else {
          //set datetime format to label or send to the server

          return;
        }
      } else {
        alert("Date format error!");
        event.preventDefault();
      }
    } else {
      alert("Fill out all the fields!");
      event.preventDefault();
    }
  }
}
