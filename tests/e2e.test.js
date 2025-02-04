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

// Helper function to delay execution
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function log(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

async function attemptLogin(retryCount = 3, delayMs = 5000) {
  for (let i = 0; i < retryCount; i++) {
    try {
      if (i > 0) {
        log(`⚠️ Retry attempt ${i + 1} of ${retryCount}...`);
        await delay(delayMs);
      }

      const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      });

      const loginData = await loginResponse.json();
      log(
        `Login Status (Attempt ${i + 1}): ${loginResponse.status}`,
        loginData
      );

      if (loginResponse.ok) {
        return { success: true, data: loginData };
      }

      if (loginResponse.status === 404) {
        log("User not found, waiting longer before retry...");
        await delay(delayMs * 2);
        continue;
      }
    } catch (error) {
      log(`Login attempt ${i + 1} failed with error:`, error.message);
    }
  }
  return { success: false, error: "Max retry attempts reached" };
}

async function waitForOTP(email) {
  // In a real environment, you would check an email inbox
  // For testing, we'll wait a moment and then check the database
  await delay(2000); // Wait for 2 seconds

  try {
    const response = await fetch(`${BASE_URL}/auth/get-test-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    return data.otp;
  } catch (error) {
    console.error("Error getting OTP:", error);
    return null;
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

    // Wait longer after registration
    log("Waiting for registration to propagate...");
    await delay(10000); // Wait 10 seconds

    // 2. Login Test with retries
    log("\n🔵 Starting Login Test");
    const loginResult = await attemptLogin(3, 5000);

    if (!loginResult.success) {
      throw new Error(`Login failed after all retries: ${loginResult.error}`);
    }

    await delay(3000);

    // 3. OTP Verification Test
    log("\n🔵 Starting OTP Verification Test");
    const testOTP = "123456";
    const otpResponse = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testUser.email,
        otp: testOTP,
      }),
    });
    const otpData = await otpResponse.json();
    log(`OTP Verification Status: ${otpResponse.status}`, otpData);

    if (!otpResponse.ok) {
      throw new Error(`OTP verification failed: ${otpData.error}`);
    }

    authToken = otpData.token;
    if (!authToken) {
      throw new Error("No token received after OTP verification");
    }
    log("✅ Authentication successful, token received");

    await delay(3000);

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

    await delay(3000);

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

    await delay(3000);

    // 6. Get All Bookings Test
    log("\n🔵 Starting Get Bookings Test");
    const getBookingsResponse = await fetch(`${BASE_URL}/booking`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const bookingsData = await getBookingsResponse.json();
    log(`Get Bookings Status: ${getBookingsResponse.status}`, bookingsData);

    await delay(3000);

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

    await delay(3000);

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
    process.exit(1);
  }
}

// Run the tests
runTests().catch((error) => {
  console.error("Test suite failed:", error);
  process.exit(1);
});
