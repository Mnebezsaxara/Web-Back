document.addEventListener("DOMContentLoaded", function () {
  // Add event listeners to all buy buttons
  document.querySelectorAll(".buy-membership").forEach((button) => {
    button.addEventListener("click", handleMembershipClick);
  });
});

// Separate function to handle initial click
function handleMembershipClick(event) {
  const token = localStorage.getItem("token");
  if (!token) {
    showNotification(
      "Для покупки абонемента необходимо авторизоваться",
      "error"
    );
    setTimeout(() => {
      window.location.href = "/form.html";
    }, 2000); // Wait 2 seconds before redirecting
    return;
  }
  handleMembershipPurchase(event);
}

async function handleMembershipPurchase(event) {
  const token = localStorage.getItem("token");
  const membershipType = event.target.dataset.type;

  try {
    const response = await fetch(
      "https://web-backend-adpr.onrender.com/payment/gym-membership",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ membershipType }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      showNotification("Абонемент успешно приобретен!", "success");
    } else {
      showNotification(`Ошибка: ${data.error}`, "error");
    }
  } catch (error) {
    showNotification("Произошла ошибка при обработке платежа", "error");
    console.error("Error:", error);
  }
}
