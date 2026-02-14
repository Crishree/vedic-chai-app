const ordersBody = document.getElementById("ordersBody");
const verifyBtn = document.getElementById("verifyBtn");
const verifyCodeInput = document.getElementById("verifyCode");
const verifyStatus = document.getElementById("verifyStatus");
const outletBrandTitle = document.getElementById("outletBrandTitle");
const inrFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const itemNames = {
  "chai-masala": "Masala Chai",
  "chai-ginger": "Ginger Chai",
  samosa: "Samosa (2 pcs)",
  khaman: "Khaman Dhokla",
  "bun-maska": "Bun Maska"
};

function statusHtml(message, type) {
  return `<div class="status ${type}">${message}</div>`;
}

function formatOrderItems(items) {
  return items.map((line) => `${itemNames[line.itemId] || line.itemId} x${line.quantity}`).join(", ");
}

function renderOrders(orders) {
  if (!orders.length) {
    ordersBody.innerHTML = `<tr><td colspan="8">No paid orders yet.</td></tr>`;
    return;
  }

  ordersBody.innerHTML = orders
    .map((order) => {
      const time = new Date(order.createdAt).toLocaleTimeString();
      return `
        <tr>
          <td>${time}</td>
          <td>${order.customerName}</td>
          <td>${order.phone}</td>
          <td>${formatOrderItems(order.items)}</td>
          <td>₹${inrFormatter.format(Number(order.total))}</td>
          <td>${order.paymentMethod || "UPI"}</td>
          <td><strong>${order.pickupCode}</strong></td>
          <td>${order.status}</td>
        </tr>
      `;
    })
    .join("");
}

async function refreshOrders() {
  try {
    const [ordersRes, configRes] = await Promise.all([fetch("/api/orders"), fetch("/api/payment-config")]);
    const data = await ordersRes.json();
    const configData = await configRes.json();
    const brandName = String(configData?.paymentConfig?.brandName || "").trim() || "Your Brand";
    if (outletBrandTitle) {
      outletBrandTitle.textContent = `${brandName} Outlet Dashboard`;
    }
    document.title = `${brandName} Outlet Dashboard`;
    renderOrders(data.orders || []);
  } catch (err) {
    ordersBody.innerHTML = `<tr><td colspan="8">Failed to fetch orders.</td></tr>`;
  }
}

async function verifyPickup() {
  const pickupCode = verifyCodeInput.value.trim().toUpperCase();
  if (!pickupCode) {
    verifyStatus.innerHTML = statusHtml("Enter a pickup code.", "error");
    return;
  }

  verifyBtn.disabled = true;
  try {
    const res = await fetch("/api/verify-pickup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pickupCode })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Verification failed.");
    }
    verifyStatus.innerHTML = statusHtml(data.message, "success");
    verifyCodeInput.value = "";
    refreshOrders();
  } catch (err) {
    verifyStatus.innerHTML = statusHtml(err.message, "error");
  } finally {
    verifyBtn.disabled = false;
  }
}

verifyBtn.addEventListener("click", verifyPickup);
refreshOrders();
setInterval(refreshOrders, 5000);
