const slides = document.querySelectorAll(".slide");
const previousButton = document.querySelector(".slider-button.prev");
const nextButton = document.querySelector(".slider-button.next");
const loginForm = document.querySelector("#loginForm");
const existingLoginForm = document.querySelector("#existingLoginForm");
const dashboard = document.querySelector("#dashboard");
const welcomeText = document.querySelector("#welcomeText");
const navLogin = document.querySelector("#navLogin");
const logoutButton = document.querySelector("#logoutButton");
const showLoginButton = document.querySelector("#showLoginButton");
const showRegisterButton = document.querySelector("#showRegisterButton");

let currentSlide = 0;
let autoSlideTimer;

function showSlide(index) {
  slides[currentSlide].classList.remove("active");
  currentSlide = (index + slides.length) % slides.length;
  slides[currentSlide].classList.add("active");
}

function nextSlide() {
  showSlide(currentSlide + 1);
}

function previousSlide() {
  showSlide(currentSlide - 1);
}

function restartAutoSlide() {
  clearInterval(autoSlideTimer);
  autoSlideTimer = setInterval(nextSlide, 3000);
}

nextButton.addEventListener("click", () => {
  nextSlide();
  restartAutoSlide();
});

previousButton.addEventListener("click", () => {
  previousSlide();
  restartAutoSlide();
});

restartAutoSlide();

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const email = document.querySelector("#email").value.trim();
  const fullName = document.querySelector("#fullName").value.trim();

  loginForm.classList.add("hidden");
  existingLoginForm.classList.add("hidden");
  dashboard.classList.remove("hidden");
  welcomeText.textContent = `Welcome, ${fullName}. Your account is ready with ${email}.`;
  navLogin.textContent = "Profile";
});

existingLoginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const email = document.querySelector("#loginEmail").value.trim();

  existingLoginForm.classList.add("hidden");
  loginForm.classList.add("hidden");
  dashboard.classList.remove("hidden");
  welcomeText.textContent = `Welcome back. You are logged in as ${email}.`;
  navLogin.textContent = "Profile";
});

showLoginButton.addEventListener("click", () => {
  loginForm.classList.add("hidden");
  existingLoginForm.classList.remove("hidden");
});

showRegisterButton.addEventListener("click", () => {
  existingLoginForm.classList.add("hidden");
  loginForm.classList.remove("hidden");
});

logoutButton.addEventListener("click", () => {
  dashboard.classList.add("hidden");
  loginForm.classList.remove("hidden");
  existingLoginForm.classList.add("hidden");
  loginForm.reset();
  existingLoginForm.reset();
  navLogin.textContent = "Login";
});
