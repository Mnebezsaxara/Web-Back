import Booking from "../models/booking.js";

const FIELD_PRICES = {
  "Поле Бекет Батыра": 15000,
  "Поле Орынбаева": 15000,
};

export const getAllBookings = async (req, res) => {
  const { filter, sort, page = 1 } = req.query;
  const limit = 10; // Количество записей на странице
  const skip = (page - 1) * limit;

  try {
    let query = { email: req.user.email }; // Показывать бронирования только для текущего пользователя
    if (filter) {
      query.field = filter; // Фильтрация по полю
    }

    let sortOption = {};
    if (sort === "date") sortOption.date = 1;
    if (sort === "time") sortOption.time = 1;

    console.log("Запрос к базе данных:", query); // Лог фильтра
    console.log("Пагинация: пропуск", skip, "лимит", limit);

    const totalRecords = await Booking.countDocuments(query); // Общее количество записей
    const totalPages = Math.ceil(totalRecords / limit);

    const bookings = await Booking.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    console.log("Найденные бронирования:", bookings); // Лог бронирований

    res.status(200).json({ data: bookings, totalPages });
  } catch (error) {
    console.error("Ошибка при получении бронирований:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// Создать новое бронирование
export const createBooking = async (req, res) => {
  console.log("1. Raw request body:", req.body); // Debug log

  const { date, time, field, price } = req.body;
  console.log("2. Destructured data:", { date, time, field, price }); // Debug log

  if (!date || !time || !field || !price) {
    console.log("3. Missing fields:", { date, time, field, price }); // Debug log
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const bookingData = {
      date,
      time,
      field,
      email: req.user.email,
      price: Number(price), // Ensure price is a number
      paymentStatus: "pending",
    };
    console.log("4. Creating booking with data:", bookingData); // Debug log

    const booking = await Booking.create(bookingData);
    console.log("5. Created booking:", booking); // Debug log

    res.status(201).json(booking);
  } catch (error) {
    console.error("6. Error creating booking:", error); // Debug log
    res.status(500).json({ error: error.message });
  }
};

// Обновить бронирование
export const updateBooking = async (req, res) => {
  const { email, date, time, field, newDate, newTime, newField } = req.body;

  if (!email || !date || !time || !field) {
    return res
      .status(400)
      .json({ error: "All fields are required for update" });
  }

  try {
    const booking = await Booking.findOneAndUpdate(
      { email, date, time, field }, // Поиск по email и параметрам бронирования
      {
        date: newDate || date,
        time: newTime || time,
        field: newField || field,
      }, // Обновление
      { new: true }
    );
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Удалить бронирование
export const deleteBooking = async (req, res) => {
  const { email, date, time, field } = req.body;

  if (!email || !date || !time || !field) {
    return res
      .status(400)
      .json({ error: "All fields are required for deletion" });
  }

  try {
    const booking = await Booking.findOneAndDelete({
      email,
      date,
      time,
      field,
    });
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    res.status(200).json({ message: "Booking successfully deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};