// Изначально скрываем элементы управления, таблицу и пагинацию
document.getElementById("controls").style.display = "none";
document.getElementById("bookings-list").style.display = "none";
document.getElementById("pagination").style.display = "none";

// Функция для получения токена из localStorage
function getToken() {
  return localStorage.getItem("token");
}

// Проверка авторизации перед выполнением действий
function isAuthenticated() {
  return !!getToken();
}

// Constants for field prices
const FIELD_PRICES = {
  "Поле Бекет Батыра": 15000,
  "Поле Орынбаева": 15000,
};

// Create booking without payment
document
  .getElementById("booking-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const field = document.getElementById("field").value;
    const price = FIELD_PRICES[field];

    const bookingData = {
      date,
      time,
      field,
      price: Number(price),
    };
    console.log("Sending booking data:", bookingData);

    try {
      const response = await fetch("http://localhost:8080/booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();
      console.log("Server response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to create booking");
      }

      alert(
        "Бронирование успешно создано! Перейдите в 'Посмотреть бронирования' для оплаты."
      );
      document.getElementById("booking-form").reset();
    } catch (error) {
      console.error("Error details:", error);
      alert("Ошибка: " + error.message);
    }
  });

// Получение бронирований с параметрами (сортировка, фильтрация, пагинация)
async function fetchBookings(page = 1, sort = "", filter = "") {
  const url = new URL("http://localhost:8080/booking");
  url.searchParams.append("page", page);
  if (sort) url.searchParams.append("sort", sort);
  if (filter) url.searchParams.append("filter", filter);

  if (!isAuthenticated()) {
    alert("Вы должны авторизоваться, чтобы управлять бронированием.");
    return;
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    const bookings = await response.json();

    if (response.ok) {
      renderBookingsTable(bookings.data); // Отобразить таблицу с бронированиями
      renderPagination(bookings.totalPages, page, sort, filter); // Отобразить пагинацию
    } else {
      alert("Ошибка при получении бронирований.");
    }
  } catch (error) {
    console.error("Ошибка при получении бронирований:", error);
    alert("Ошибка при загрузке бронирований.");
  }
}

// Отображение бронирований в виде таблицы
function renderBookingsTable(bookings) {
  if (!Array.isArray(bookings) || bookings.length === 0) {
    document.getElementById("bookings-list").innerHTML =
      "<p>Нет данных для отображения.</p>";
    return;
  }

  const table = `
    <table>
        <thead>
            <tr>
                <th>Дата</th>
                <th>Время</th>
                <th>Поле</th>
                <th>Статус оплаты</th>
                <th>Действия</th>
            </tr>
        </thead>
        <tbody>
            ${bookings
              .map(
                (booking) => `
                <tr>
                    <td>${booking.date}</td>
                    <td>${booking.time}</td>
                    <td>${booking.field}</td>
                    <td>${
                      booking.paymentStatus === "completed"
                        ? "Оплачено"
                        : "Не оплачено"
                    }</td>
                    <td>
                        ${
                          booking.paymentStatus === "pending"
                            ? `<button onclick="handlePayment('${booking._id}')" class="pay-button">
                                Оплатить (${booking.price} ₸)
                            </button>`
                            : ""
                        }
                    </td>
                </tr>
            `
              )
              .join("")}
        </tbody>
    </table>
`;

  document.getElementById("bookings-list").innerHTML = table;

  // Показываем кнопки сортировки и пагинацию только при просмотре бронирований
  document.getElementById("controls").style.display = "block";
  document.getElementById("pagination").style.display = "block";
}

// Кнопка "Посмотреть бронирования"
document.getElementById("view-bookings").addEventListener("click", () => {
  document.getElementById("bookings-list").style.display = "block";
  document.getElementById("controls").style.display = "block";
  document.getElementById("pagination").style.display = "block";
  console.log("Отправляем токен:", getToken());
  fetchBookings();
});

// Кнопка "Обновить бронирование"
document
  .getElementById("update-booking")
  .addEventListener("click", async () => {
    const email = prompt("Введите ваш email:");
    const date = prompt("Введите дату бронирования (YYYY-MM-DD):");
    const time = prompt("Введите время бронирования (HH:MM):");
    const field = prompt("Введите поле бронирования:");

    const newDate = prompt("Введите новую дату:");
    const newTime = prompt("Введите новое время:");
    const newField = prompt("Введите новое поле:");

    if (!email || !date || !time || !field) {
      alert("Все поля обязательны для обновления.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/booking/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          email,
          date,
          time,
          field,
          newDate,
          newTime,
          newField,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Бронирование успешно обновлено");
      } else {
        alert(`Ошибка: ${data.error || "Не удалось обновить бронирование"}`);
      }
    } catch (error) {
      console.error("Ошибка при обновлении бронирования:", error);
      alert("Не удалось обновить бронирование.");
    }
  });

// Кнопка "Удалить бронирование"
document
  .getElementById("delete-booking")
  .addEventListener("click", async () => {
    const email = prompt("Введите ваш email:");
    const date = prompt("Введите дату бронирования (YYYY-MM-DD):");
    const time = prompt("Введите время бронирования (HH:MM):");
    const field = prompt("Введите поле бронирования:");

    if (!email || !date || !time || !field) {
      alert("Все поля обязательны для удаления.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/booking/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ email, date, time, field }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Бронирование успешно удалено");
      } else {
        alert(`Ошибка: ${data.error || "Не удалось удалить бронирование"}`);
      }
    } catch (error) {
      console.error("Ошибка при удалении бронирования:", error);
      alert("Не удалось удалить бронирование.");
    }
  });

// Сортировка
document.getElementById("sort-date").addEventListener("click", () => {
  const filter = document.getElementById("filter-field").value;
  fetchBookings(1, "date", filter);
});
document.getElementById("sort-time").addEventListener("click", () => {
  const filter = document.getElementById("filter-field").value;
  fetchBookings(1, "time", filter);
});

// Фильтрация
document.getElementById("filter-field").addEventListener("change", (event) => {
  fetchBookings(1, "", event.target.value);
});

// Пагинация
function renderPagination(totalPages, currentPage, sort, filter) {
  if (totalPages <= 1) {
    document.getElementById("pagination").innerHTML = "";
    return;
  }

  const buttons = Array.from({ length: totalPages }, (_, i) => {
    const page = i + 1;
    return `
                <button class="${
                  page === currentPage ? "active" : ""
                }" onclick="fetchBookings(${page}, '${sort}', '${filter}')">
                    ${page}
                </button>
            `;
  }).join("");

  document.getElementById("pagination").innerHTML = buttons;
}

// Function to handle payment
async function handlePayment(bookingId) {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Пожалуйста, войдите в систему");
    return;
  }

  try {
    const response = await fetch("http://localhost:8080/payment/field", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ bookingId }),
    });

    const data = await response.json();

    if (response.ok) {
      alert("Оплата прошла успешно!");
      fetchBookings(); // Refresh the bookings list
    } else {
      alert(`Ошибка: ${data.error}`);
    }
  } catch (error) {
    alert("Ошибка при обработке платежа");
    console.error("Error:", error);
  }
}
