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
  var full_date = "" + year + month + date;
  console.log(full_date);
  var full_date_int = parseInt(full_date, 10);
  return full_date_int;
}

//ex) 2244
function toTimeFormInt(hour, min) {
    var full_time = "" + hour + min;
    console.log(full_time);
    var full_time_int = parseInt(full_time, 10);
    return full_time_int;
}

//larger value on the left hand will return true
//larger value on the right hand will return false
function isLarger(compareA, compareB) {
  if (compareA > compareB)
    return 1;
  else if (compareA == compareB)
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

window.onload = function() {

  var car_info_form = document.getElementById("car_info_form");
  if (car_info_form.addEventListener) {
      car_info_form.addEventListener("submit", (event) => {
      var result = executeInfoForm(); //function duplication! need refactor
      if (result == false) {
        console.log("false");
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
  /*
  var uploadField = document.getElementById("car_img");

  uploadField.onchange = function() {
      if(this.files[0].size > 500000 ){ //50MB
         alert("File is too big!");
         this.value = "";
      };
  };
  */
  //String values
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
          select.empty();
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
        select.empty();
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
    var y_f_val = year_f_select.value;
    var m_f_val =  month_f_select.value;
    var d_f_val = date_f_select.value;
    var y_t_val = year_t_select.value;
    var m_t_val =  month_t_select.value;
    var d_t_val = date_t_select.value;
    var h_f_val = hour_f_select.value;
    var m_f_val = min_f_select.value;
    var h_t_val = hour_t_select.value;
    var m_t_val = min_t_select.value;
    if (isValidDate(y_f_val, m_f_val, d_f_val)
     && isValidDate(y_t_val, m_t_val, d_t_val)
     && isValidTime(h_f_val, m_f_val)
     && isValidTime(h_t_val, m_t_val)) {
     //returns integer values
     var from_full_date = toDateFormInt(y_f_val, m_f_val, d_f_val);
     var to_full_date = toDateFormInt(y_t_val, m_t_val, d_t_val);
     var comapre_res = isLarger(to_full_date, from_full_date);
      if (comapre_res == 1) { //normal date: pass
        console.log("pass");
      } else if (comapre_res == 0) { //same date: compare time
        var from_full_time = toTimeFormInt(h_f_val, m_f_val);
        var to_full_time = toTimeFormInt(h_t_val, m_t_val);
        if (isLarger(to_full_time, from_full_time) != 1) {
          alert("Date format error!");
          event.preventDefault();
        } else {
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