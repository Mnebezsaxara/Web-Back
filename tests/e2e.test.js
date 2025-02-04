import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const BASE_URL = "https://web-backend-adpr.onrender.com";
let authToken = null;
let bookingId = null;

const testUser = {
  email: `test${Date.now()}@example.com`,
  password: "test123456",
};

async function log(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

async function runTests() {
  try {
    // 1. Registration Test
    log("🔵 Starting Registration Test");
    const registerResponse = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });
    const registerData = await registerResponse.json();
    log(`Registration Status: ${registerResponse.status}`, registerData);

    // 2. Login Test
    log("\n🔵 Starting Login Test");
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });
    const loginData = await loginResponse.json();
    log(`Login Status: ${loginResponse.status}`, loginData);

    // 3. OTP Verification Test
    log("\n🔵 Starting OTP Verification Test");
    const otp = "123456"; // This should be retrieved from email in production
    const otpResponse = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testUser.email,
        otp,
      }),
    });
    const otpData = await otpResponse.json();
    log(`OTP Verification Status: ${otpResponse.status}`, otpData);

    if (otpData.token) {
      authToken = otpData.token;
      log("✅ Authentication successful, token received");
    }

    // 4. Gym Membership Purchase Test
    log("\n🔵 Starting Gym Membership Purchase Test");
    const membershipResponse = await fetch(
      `${BASE_URL}/payment/gym-membership`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          membershipType: "1month_unlimited",
        }),
      }
    );
    const membershipData = await membershipResponse.json();
    log(
      `Membership Purchase Status: ${membershipResponse.status}`,
      membershipData
    );

    // 5. Create Booking Test
    log("\n🔵 Starting Booking Creation Test");
    const bookingResponse = await fetch(`${BASE_URL}/booking`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        date: "2024-03-01",
        time: "14:00",
        field: "Поле Бекет Батыра",
        price: 15000,
      }),
    });
    const bookingData = await bookingResponse.json();
    log(`Booking Creation Status: ${bookingResponse.status}`, bookingData);

    if (bookingData._id) {
      bookingId = bookingData._id;
    }

    // 6. Get All Bookings Test
    log("\n🔵 Starting Get Bookings Test");
    const getBookingsResponse = await fetch(`${BASE_URL}/booking`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const bookingsData = await getBookingsResponse.json();
    log(`Get Bookings Status: ${getBookingsResponse.status}`, bookingsData);

    // 7. Process Field Payment Test
    if (bookingId) {
      log("\n🔵 Starting Field Payment Test");
      const paymentResponse = await fetch(`${BASE_URL}/payment/field`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          bookingId,
        }),
      });
      const paymentData = await paymentResponse.json();
      log(`Payment Processing Status: ${paymentResponse.status}`, paymentData);
    }

    // 8. Get Payment History Test
    log("\n🔵 Starting Payment History Test");
    const historyResponse = await fetch(`${BASE_URL}/payment/history`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const historyData = await historyResponse.json();
    log(`Payment History Status: ${historyResponse.status}`, historyData);

    log("\n✅ All tests completed successfully!");
  } catch (error) {
    log("\n❌ Test failed:", {
      message: error.message,
      stack: error.stack,
    });
  }
}

// Run the tests
runTests().catch(console.error);
