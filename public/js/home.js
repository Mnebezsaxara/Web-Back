// Beket Batyra Section
const field1 = document.getElementById("field1");
const video1 = document.getElementById("video1");

field1.addEventListener("mouseenter", () => {
    if (video1.paused) { // Проверяем, остановлено ли видео
        video1.play().catch((err) => console.error("Error while playing video:", err));
    }
});

field1.addEventListener("mouseleave", () => {
    if (!video1.paused) { // Проверяем, воспроизводится ли видео
        video1.pause();
    }
});

// Gym Section
const gym = document.getElementById("gym");
const video2 = document.getElementById("video2");

gym.addEventListener("mouseenter", () => {
    if (video2.paused) {
        video2.play().catch((err) => console.error("Error while playing video:", err));
    }
});

gym.addEventListener("mouseleave", () => {
    if (!video2.paused) {
        video2.pause();
    }
});

// Orynbaeva Section
const field2 = document.getElementById("field2");
const video3 = document.getElementById("video3");

field2.addEventListener("mouseenter", () => {
    if (video3.paused) {
        video3.play().catch((err) => console.error("Error while playing video:", err));
    }
});

field2.addEventListener("mouseleave", () => {
    if (!video3.paused) {
        video3.pause();
    }
});
