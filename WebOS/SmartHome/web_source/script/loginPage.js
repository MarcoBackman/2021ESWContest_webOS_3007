// show a message with a type of the input
function showMessage(input, message, type) {
	// get the small element and set the message
	const msg = input.parentNode.querySelector("small");
	msg.innerText = message;
	// update the class for the input
	input.className = type ? "success" : "error";
	return type;
}

function showError(input, message) {
	return showMessage(input, message, false);
}

function showSuccess(input) {
	return showMessage(input, "", true);
}

function hasValue(input, message) {
  if (!input) {
    return false;
  } else if (input.value.trim() === "") {
		return showError(input, message);
	}
	return showSuccess(input);
}

function validateEmail(input, requiredMsg, invalidMsg) {
	// check if the value is not empty
	if (!hasValue(input, requiredMsg)) {
		return false;
	}
	// validate email format
	const emailRegex =
		/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

	const email = input.value.trim();
	if (!emailRegex.test(email)) {
		return showError(input, invalidMsg);
	}
	return true;
}

/*
function setAction(form) {
  const form_action =  document.getElementsByName("myForm").action;
  event.preventDefault();
  var validity = checkInputForm();
  if (validity) {
    form.action = "/user_login";
    form.method = "post"
    form.submit();
  } else {
    alert("ID/PW not entered");
  }
}

function checkInputForm() {
  const user_id  = document.querySelector('#user_id');
  const user_pw = document.querySelector('#user_pw');
  if (user_id.value == "" || user_pw.value == "") {
    return false;
  } else {
    return true;
  }
}
*/

window.onload = function() {
  const togglePassword = document.querySelector('#togglePassword');
  const enter = document.querySelector('#login_button');
  const user_pw = document.querySelector('#user_pw');

  togglePassword.addEventListener('click', function (e) {
      // toggle the type attribute
      const type = user_pw.getAttribute('type') === 'password' ? 'text' : 'password';
      user_pw.setAttribute('type', type);
      // toggle the eye / eye slash icon
      this.classList.toggle('bi-eye');
  });

  /* //--for registeration or pw find
  const form = document.querySelector("#signup");

  const NAME_REQUIRED = "Please enter your name";
  const EMAIL_REQUIRED = "Please enter your email";
  const EMAIL_INVALID = "Please enter a correct email address format";

  form.addEventListener("submit", function (event) {
  	// stop form submission
  	event.preventDefault();

  	// validate the form
  	let nameValid = hasValue(form.elements["name"], NAME_REQUIRED);
  	let emailValid = validateEmail(form.elements["email"], EMAIL_REQUIRED, EMAIL_INVALID);
  	// if valid, submit the form.
  	if (nameValid && emailValid) {
  		alert("Demo only. No form was posted.");
    }
  });
  */
}