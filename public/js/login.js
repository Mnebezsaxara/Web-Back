const loginForm = document.getElementById("login-form");
const registerButton = document.getElementById("register-button");
const logoutButton = document.getElementById("logout-button");
const otpContainer = document.getElementById("otp-container");
const otpInput = document.getElementById("otp");
const verifyOtpButton = document.getElementById("verify-otp-button");

// Функция для проверки сессии
async function checkSession() {
  const token = localStorage.getItem("token");
  if (!token) return; // Если токена нет, пропускаем проверку

  try {
    const response = await fetch("http://localhost:8080/auth/verify-session", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();

    if (response.status === 403) {
      showNotification("Сессия истекла, выполните повторный вход.", "error");
      localStorage.removeItem("token");
      setTimeout(() => {
        window.location.reload();
      }, 2000); // Даем время прочитать сообщение перед перезагрузкой
    }
  } catch (error) {
    console.error("Ошибка проверки сессии:", error);
    showNotification("Ошибка проверки сессии", "error");
  }
}

// Проверяем сессию ТОЛЬКО если есть токен
if (localStorage.getItem("token")) {
  checkSession();
  logoutButton.style.display = "block";
}

// Авторизация пользователя
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("http://localhost:8080/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": navigator.userAgent, // Передаем deviceId
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      showNotification("Код подтверждения отправлен на вашу почту", "success");
      otpContainer.style.display = "block";
    } else {
      showNotification(data.error || "Ошибка при входе", "error");
    }
  } catch (error) {
    showNotification("Ошибка при входе в систему", "error");
  }
});

// Подтверждение OTP
verifyOtpButton.addEventListener("click", async () => {
  const otp = otpInput.value;
  const email = document.getElementById("email").value;

  try {
    const response = await fetch("http://localhost:8080/auth/verify-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": navigator.userAgent,
      },
      body: JSON.stringify({ email, otp }),
    });

    const data = await response.json();

    if (response.ok) {
      showNotification("Авторизация успешна!", "success");
      localStorage.setItem("token", data.token);
      localStorage.setItem("userRole", data.role); // Store user role

      // Redirect based on role
      if (data.role === "admin") {
        window.location.href = "/admin-panel";
      } else {
        window.location.reload();
      }
    } else {
      showNotification(data.error || "Ошибка при подтверждении OTP", "error");
    }
  } catch (error) {
    showNotification("Ошибка при подтверждении OTP", "error");
  }
});

// Регистрация пользователя
registerButton.addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("http://localhost:8080/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      showNotification("Регистрация успешна", "success");
      localStorage.setItem("token", data.token);
    } else {
      showNotification("Ошибка: " + data.error, "error");
    }
  } catch (error) {
    showNotification("Ошибка: " + error.message, "error");
  }
});

// Выход из системы
logoutButton.addEventListener("click", () => {
  localStorage.removeItem("token");
  showNotification("Вы вышли из системы", "success");
  window.location.reload();
});
