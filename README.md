SportLife – Sport Services Booking system
SportLife is a special web application designed for comfortable booking of sport facilities such as football fields and purchasing gym membership. This way, users can manage their bookings, payments for services and receive notifications about their order status. 
The primary focus is on integrating MongoDB in the project, providing fast and efficient data processing, as well reliable storage sources information about users,their payments,bookings and so on.
Key features:
1.	Simple Registration and Authentication:
1.	User registration system with email and password
2.	Login with two-factor authentication for ensure security (Otp)
3.	Support using JWT token for authorization and session management system
2.	Flexible Booking Management:
1.	Create,modify and delete bookings
2.	Select specific booking time and football fields
3.	Ability to filter and sort booking list
3.	Advanced Payment System:
1.	Purchase gym membership for different periods
2.	Pay for rent of football fields
3.	Support for payment status
4.	Admin Panel:
1.	Manage users,their payments and bookings
2.	View overall statistics of bookings and income
3.	Opportunity to cancel bookings and make a refunds
Database Operations with MongoDB
Sporlife is primarily based on MongoDB features like nested documents and relations between collections.
1.	Nested Documents:
1.	User profiles (models/User.js) store active sessions, providing users ability to manage logins from different devices without needing separate records.
•	Payments records (models/Payment.js) contain transaction information,including amount,status and service type. This way payment history and its details can be easily accessed 
•	Booking details (models/Booking.js) based on reservation either of gym session or football fields rent.
2.	Relations between the collections:
•	Each booking is connected to specific user via userId,allowing to easily retrieve all of the user’s booking data
•	Payments are linked to the bookings by using bookingId, making proper transaction management
3.	Data optimization:
•	Use of compound indexes for fast search of data
•	Implementation of aggregation pipelines for booking and analysis of payment to generate a report
•	Use of TTL (Time To Live) to automatically remove expired records such as OTP codes or outdated bookings
4.	Data security:
•	Passwors that are stored in encrypted form like a bcrypt to prevent data leaks
•	JWT session tokenization to protects user’s data
•	API’s access levels restriction in order to prevent attacks on the server
Why MongoDB is most suitable choice for Sportlife:
1.Schema Flexibility and Data Handling
Sportlife containd different types of data,including user autentiocation details
bookings,payments and each on have different data and structure. MongoDB allows our project to store information such as nested documents, schemas and relational databases.
2.Scalability and High performance
Sporlife project may experience a growing amount of users, transactions and data in general and MongoDB can help with it. MongoDB gives an opportunity to change and update databases,documents and etc.Moreover it can efficiently distribute data across nodes.
3.Seamless integrations with Node.js and Express.js that is basically the core of project’s backend. Use of Mongoose ORM simplifies data modeling, validation and ensures efficient interaction between the project and the database
Technologies that were used:
•	Backend: Node.js, Express.js, MongoDB, Mongoose.
•	Frontend: HTML, CSS, JavaScript.
•	Security: JWT, bcrypt, API rate limiting.
•	DevOps: Deployment on MongoDB Atlas cloud service and render.

API Routes

•	Authentication
1.	POST /auth/register – Register a user
2.	POST /auth/login – Login with OTP
3.	POST /auth/verify-otp – Verify OTP
4.	POST /auth/logout – Logout
•	Booking
1.	GET /booking – Retrieve a list of bookings
2.	POST /booking – Create a booking
3.	PUT /booking – Update a booking
4.	DELETE /booking – Delete a booking
•	Payment
1.	POST /payment/field – Pay for field booking
2.	POST /payment/gym – Purchase a gym membership
3.	GET /payment/history – Retrieve payment history



				Aggregations that can be added
1. Field Usage Analytics
🔹 Группировка бронирований по полю, месяцу и году
db.bookings.aggregate([
  {
    $group: {
      _id: {
        field: "$field",
        month: { $month: { $dateFromString: { dateString: "$date" } } },
        year: { $year: { $dateFromString: { dateString: "$date" } } },
      },
      totalBookings: { $sum: 1 },
      totalRevenue: { $sum: "$price" },
      averagePrice: { $avg: "$price" },
      uniqueUsers: { $addToSet: "$email" },
    },
  },
  {
    $project: {
      field: "$_id.field",
      month: "$_id.month",
      year: "$_id.year",
      totalBookings: 1,
      totalRevenue: 1,
      averagePrice: { $round: ["$averagePrice", 2] },
      uniqueUserCount: { $size: "$uniqueUsers" },
    },
  },
  {
    $sort: { year: -1, month: -1, totalRevenue: -1 },
  },
]);
2. Payment Analytics with Time-Based Trends
🔹 Статистика по платежам (месяц, тип, статус и абонементы)
db.payment.aggregate([
  {
    $facet: {
      monthlyRevenue: [
        {
          $group: {
            _id: {
              month: { $month: "$paymentDate" },
              year: { $year: "$paymentDate" },
              type: "$type",
            },
            revenue: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": -1, "_id.month": -1 } },
      ],
      membershipStats: [
        { $match: { type: "gym_membership" } },
        {
          $group: {
            _id: "$membershipDetails.type",
            totalSold: { $sum: 1 },
            totalRevenue: { $sum: "$amount" },
            averagePrice: { $avg: "$amount" },
          },
        },
      ],
      paymentStatusStats: [
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalAmount: { $sum: "$amount" },
          },
        },
      ],
    },
  },
]);
3. User Engagement Analytics
🔹 Активность пользователей (бронирования, платежи, статус абонемента)
db.user.aggregate([
  {
    $lookup: {
      from: "bookings",
      localField: "email",
      foreignField: "email",
      as: "bookings",
    },
  },
  {
    $lookup: {
      from: "payments",
      localField: "_id",
      foreignField: "userId",
      as: "payments",
    },
  },
  {
    $project: {
      email: 1,
      role: 1,
      bookingCount: { $size: "$bookings" },
      totalSpent: { $sum: "$payments.amount" },
      lastActivity: { $max: "$payments.paymentDate" },
      membershipStatus: {
        $cond: {
          if: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: "$payments",
                    as: "payment",
                    cond: {
                      $and: [
                        { $eq: ["$$payment.type", "gym_membership"] },
                        { $eq: ["$$payment.status", "completed"] },
                      ],
                    },
                  },
                },
              },
              0,
            ],
          },
          then: "Active",
          else: "Inactive",
        },
      },
    },
  },
  {
    $group: {
      _id: "$membershipStatus",
      userCount: { $sum: 1 },
      averageSpent: { $avg: "$totalSpent" },
      totalBookings: { $sum: "$bookingCount" },
    },
  },
]);
4. Peak Hours Analysis
🔹 Анализ пиковых часов по бронированиям
db.booking.aggregate([
  {
    $group: {
      _id: {
        hour: { $substr: ["$time", 0, 2] },
        field: "$field",
      },
      bookingCount: { $sum: 1 },
      averagePrice: { $avg: "$price" },
      totalRevenue: { $sum: "$price" },
    },
  },
  {
    $sort: { bookingCount: -1 },
  },
  {
    $group: {
      _id: "$_id.field",
      peakHours: {
        $push: {
          hour: "$_id.hour",
          bookingCount: "$bookingCount",
          averagePrice: "$averagePrice",
          totalRevenue: "$totalRevenue",
        },
      },
    },
  },
]);


