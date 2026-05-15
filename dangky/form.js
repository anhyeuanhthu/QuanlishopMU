// ===== VALIDATION FUNCTIONS =====

function setFeedback(element, messageElement, type, message, inputClassPrefix, msgClassPrefix) {
  if (inputClassPrefix) {
    element.classList.remove(
      `${inputClassPrefix}-error-input`,
      `${inputClassPrefix}-success-input`
    );
  }

  if (msgClassPrefix && messageElement) {
    messageElement.classList.remove(
      `${msgClassPrefix}-error`,
      `${msgClassPrefix}-success`
    );
  }

  if (type === "error") {
    if (inputClassPrefix)
      element.classList.add(`${inputClassPrefix}-error-input`);
    if (msgClassPrefix && messageElement)
      messageElement.classList.add(`${msgClassPrefix}-error`);
  } else {
    if (inputClassPrefix)
      element.classList.add(`${inputClassPrefix}-success-input`);
    if (msgClassPrefix && messageElement)
      messageElement.classList.add(`${msgClassPrefix}-success`);
  }

  if (messageElement && message) messageElement.textContent = message;
}

// ===== EMAIL VALIDATION =====
function validateEmail(email) {
  var regexEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return regexEmail.test(String(email).toLowerCase());
}

// ===== REALTIME CHECKS =====

// username
document.getElementById("username").addEventListener("blur", function () {
  if (this.value.trim() === "") {
    setFeedback(this, null, "error", "", "pw", null);
  } else {
    setFeedback(this, null, "success", "", "pw", null);
  }
});

// email
document.getElementById("email").addEventListener("blur", function () {
  const isValid = validateEmail(this.value);
  setFeedback(
    this,
    document.getElementById("email-check"),
    isValid ? "success" : "error",
    isValid ? "Email hợp lệ!" : "Email không hợp lệ!",
    "email",
    "email"
  );
});

// password confirm
document.getElementById("confirm-password").addEventListener("blur", function () {
  const password = document.getElementById("password").value;
  const confirmPassword = this.value;

  if (password !== confirmPassword || confirmPassword === "") {
    setFeedback(
      this,
      document.getElementById("confirm-error"),
      "error",
      "Mật khẩu xác nhận không khớp!",
      "pw",
      "pw"
    );
  } else {
    setFeedback(
      this,
      document.getElementById("confirm-error"),
      "success",
      "Mật khẩu hợp lệ!",
      "pw",
      "pw"
    );
  }
});


// ===== SUBMIT REGISTER =====

document.getElementById("registerform").onsubmit = async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirm = document.getElementById("confirm-password").value;
  const gender = document.getElementById("gender").value;
  const dob = document.getElementById("dob").value;

  const messageDiv = document.getElementById("message");

  // ===== VALIDATE =====
  if (!username || !email || !password || !confirm || !gender || !dob) {
    messageDiv.innerText = "Vui lòng nhập đầy đủ thông tin!";
    messageDiv.style.display = "block";
    return;
  }

  if (!validateEmail(email)) {
    messageDiv.innerText = "Email không hợp lệ!";
    messageDiv.style.display = "block";
    return;
  }

  if (password !== confirm) {
    messageDiv.innerText = "Mật khẩu xác nhận không khớp!";
    messageDiv.style.display = "block";
    return;
  }

  // ===== SEND TO SERVER =====
  try {
    const res = await fetch("http://localhost:8888/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        email,
        password,
        gender,
        dob
      })
    });

    const result = await res.json();

    messageDiv.innerText = result.message;
    messageDiv.style.display = "block";

    // nếu đăng ký thành công → chuyển qua login
    if (result.success) {
      setTimeout(() => {
        window.location.href = "../dangnhap/dangnhap.html";
      }, 1500);
    }

  } catch (err) {
    messageDiv.innerText = "Không kết nối được server!";
    messageDiv.style.display = "block";
  }
};