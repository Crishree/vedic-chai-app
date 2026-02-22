const menuToggleBtn = document.getElementById("menuToggleBtn");
const siteNav = document.getElementById("siteNav");
const demoForm = document.getElementById("demoForm");
const demoFormStatus = document.getElementById("demoFormStatus");

if (menuToggleBtn && siteNav) {
  menuToggleBtn.addEventListener("click", () => {
    siteNav.classList.toggle("open");
  });
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const href = link.getAttribute("href");
    if (!href || href === "#") return;
    const target = document.querySelector(href);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    if (siteNav) siteNav.classList.remove("open");
  });
});

if (demoForm && demoFormStatus) {
  demoForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(demoForm);
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const phone = String(form.get("phone") || "").trim();
    const stores = String(form.get("stores") || "").trim();
    if (!name || !email || !phone) {
      demoFormStatus.textContent = "Please fill name, email, and phone.";
      return;
    }
    const subject = encodeURIComponent(`PikQuik Demo Request: ${name}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nStores: ${stores || "Not provided"}\n\nRequested from www.pikquik.com`
    );
    demoFormStatus.textContent = "Opening email draft for demo request...";
    window.location.href = `mailto:sales@pikquik.com?subject=${subject}&body=${body}`;
  });
}
