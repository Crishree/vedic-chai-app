const menuList = document.getElementById("menuList");
const totalAmount = document.getElementById("totalAmount");
const payBtn = document.getElementById("payBtn");
const paymentMethodSelect = document.getElementById("paymentMethod");
const statusDiv = document.getElementById("orderStatus");
const pickupCard = document.getElementById("pickupCard");
const pickupCode = document.getElementById("pickupCode");
const homeScreenPrompt = document.getElementById("homeScreenPrompt");
const customerAppTitle = document.getElementById("customerAppTitle");

let menu = [];
const DEFAULT_METHODS = ["GPay", "PhonePe", "Paytm", "UPI", "Card", "Cash"];
const inrFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function showStatus(message, type) {
  statusDiv.innerHTML = `<div class="status ${type}">${message}</div>`;
}

function renderMenu() {
  menuList.innerHTML = menu
    .map(
      (item) => `
      <div class="menu-item">
        <strong>${item.name}</strong>
        <p>₹${inrFormatter.format(item.price)}</p>
        <label for="qty-${item.id}">Quantity</label>
        <input id="qty-${item.id}" type="number" min="0" value="0" data-id="${item.id}" />
      </div>
    `
    )
    .join("");

  menuList.querySelectorAll("input[type='number']").forEach((input) => {
    input.addEventListener("input", updateTotal);
  });
}

function getOrderItems() {
  return menu
    .map((item) => {
      const qty = Number(document.getElementById(`qty-${item.id}`).value || 0);
      return { itemId: item.id, quantity: qty };
    })
    .filter((line) => line.quantity > 0);
}

function updateTotal() {
  const total = getOrderItems().reduce((sum, line) => {
    const item = menu.find((m) => m.id === line.itemId);
    return sum + item.price * line.quantity;
  }, 0);
  totalAmount.textContent = inrFormatter.format(total);
}

async function loadMenu() {
  const [menuRes, configRes] = await Promise.all([fetch("/api/menu"), fetch("/api/payment-config")]);
  const menuData = await menuRes.json();
  const configData = await configRes.json();
  menu = menuData.menu || [];
  const enabledMethods = Array.isArray(configData?.paymentConfig?.enabledPaymentMethods) && configData.paymentConfig.enabledPaymentMethods.length
    ? configData.paymentConfig.enabledPaymentMethods
    : DEFAULT_METHODS;
  paymentMethodSelect.innerHTML = enabledMethods.map((method) => `<option>${method}</option>`).join("");
  if (enabledMethods.includes("UPI")) {
    paymentMethodSelect.value = "UPI";
  } else if (enabledMethods.length) {
    paymentMethodSelect.value = enabledMethods[0];
  }
  const appName = configData?.paymentConfig?.customerAppName;
  if (appName) {
    customerAppTitle.textContent = appName;
    document.title = appName;
  }
  renderMenu();
  updateTotal();
}

async function placeOrder() {
  const customerName = document.getElementById("customerName").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const paymentMethod = paymentMethodSelect.value;
  const items = getOrderItems();

  if (!customerName || !phone || items.length === 0) {
    showStatus("Enter customer details and select at least one menu item.", "error");
    return;
  }

  payBtn.disabled = true;
  payBtn.textContent = "Processing payment...";

  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerName, phone, items, paymentMethod })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Payment failed");
    }

    showStatus("Payment successful. Order sent to outlet for preparation.", "success");
    pickupCard.style.display = "block";
    pickupCode.textContent = data.order.pickupCode;
    if (homeScreenPrompt) {
      homeScreenPrompt.style.display = "block";
    }
  } catch (err) {
    showStatus(err.message, "error");
  } finally {
    payBtn.disabled = false;
    payBtn.textContent = "Pay & Place Order";
  }
}

payBtn.addEventListener("click", placeOrder);
loadMenu();
