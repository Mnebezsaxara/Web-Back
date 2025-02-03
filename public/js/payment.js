document.addEventListener("DOMContentLoaded", function () {
  // Add event listeners to all buy buttons
  document.querySelectorAll(".buy-membership").forEach((button) => {
    button.addEventListener("click", handleMembershipPurchase);
  });
});

async function handleMembershipPurchase(event) {
  // Check authorization only when trying to purchase
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Пожалуйста, войдите в систему для совершения платежей");
    window.location.href = "/form.html";
    return;
  }

  const membershipType = event.target.dataset.type;

  try {
    const response = await fetch(
      "http://localhost:8080/payment/gym-membership",
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
      alert("Абонемент успешно приобретен!");
    } else {
      alert(`Ошибка: ${data.error}`);
    }
  } catch (error) {
    alert("Произошла ошибка при обработке платежа");
    console.error("Error:", error);
  }
}
