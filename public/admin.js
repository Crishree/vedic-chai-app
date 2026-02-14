const summaryGrid = document.getElementById("summaryGrid");
const paymentGrid = document.getElementById("paymentGrid");
const adminOrdersBody = document.getElementById("adminOrdersBody");

const adminLoginCard = document.getElementById("adminLoginCard");
const adminContent = document.getElementById("adminContent");
const adminHomePanel = document.getElementById("adminHomePanel");
const analyticsPanel = document.getElementById("analyticsPanel");
const storesPanel = document.getElementById("storesPanel");
const goAnalyticsBtn = document.getElementById("goAnalyticsBtn");
const goStoresBtn = document.getElementById("goStoresBtn");
const backFromAnalyticsBtn = document.getElementById("backFromAnalyticsBtn");
const backFromStoresBtn = document.getElementById("backFromStoresBtn");
const analyticsRangePreset = document.getElementById("analyticsRangePreset");
const analyticsCustomRangeWrap = document.getElementById("analyticsCustomRangeWrap");
const analyticsDateFrom = document.getElementById("analyticsDateFrom");
const analyticsDateTo = document.getElementById("analyticsDateTo");
const applyAnalyticsRangeBtn = document.getElementById("applyAnalyticsRangeBtn");
const resetAnalyticsRangeBtn = document.getElementById("resetAnalyticsRangeBtn");
const analyticsRangeStatus = document.getElementById("analyticsRangeStatus");
const analyticsRangeActiveLabel = document.getElementById("analyticsRangeActiveLabel");
const analyticsViewInsightsBtn = document.getElementById("analyticsViewInsightsBtn");
const analyticsViewOrdersBtn = document.getElementById("analyticsViewOrdersBtn");
const analyticsInsightsView = document.getElementById("analyticsInsightsView");
const analyticsOrdersView = document.getElementById("analyticsOrdersView");
const networkValueTrendChartCanvas = document.getElementById("networkValueTrendChart");
const networkPaymentMixChartCanvas = document.getElementById("networkPaymentMixChart");
const networkOrderStatusChartCanvas = document.getElementById("networkOrderStatusChart");
const storeValueTrendChartCanvas = document.getElementById("storeValueTrendChart");
const adminUsernameInput = document.getElementById("adminUsername");
const adminPinInput = document.getElementById("adminPin");
const adminLoginBtn = document.getElementById("adminLoginBtn");
const adminLoginStatus = document.getElementById("adminLoginStatus");
const adminBrandHeader = document.getElementById("adminBrandHeader");
const adminBrandHeaderFallback = document.getElementById("adminBrandHeaderFallback");
const navHomeBtn = document.getElementById("navHomeBtn");
const navAnalyticsBtn = document.getElementById("navAnalyticsBtn");
const navStoresBtn = document.getElementById("navStoresBtn");
const navLogoutBtn = document.getElementById("navLogoutBtn");
const publishChangesBtn = document.getElementById("publishChangesBtn");
const publishMeta = document.getElementById("publishMeta");

const brandNameInput = document.getElementById("brandNameInput");
const brandLogoFileInput = document.getElementById("brandLogoFileInput");
const brandLogoMeta = document.getElementById("brandLogoMeta");
const useBrandLogoInput = document.getElementById("useBrandLogoInput");
const saveBrandSetupBtn = document.getElementById("saveBrandSetupBtn");
const brandSetupStatus = document.getElementById("brandSetupStatus");
const gatewayModeSelect = document.getElementById("gatewayModeSelect");
const razorpayKeyIdInput = document.getElementById("razorpayKeyIdInput");
const razorpayKeySecretInput = document.getElementById("razorpayKeySecretInput");
const razorpayWebhookSecretInput = document.getElementById("razorpayWebhookSecretInput");
const saveGatewaySetupBtn = document.getElementById("saveGatewaySetupBtn");
const gatewaySetupStatus = document.getElementById("gatewaySetupStatus");

const analyticsStoreSelect = document.getElementById("analyticsStoreSelect");
const storeSelect = document.getElementById("storeSelect");
const existingStoreModeBtn = document.getElementById("existingStoreModeBtn");
const newStoreModeBtn = document.getElementById("newStoreModeBtn");
const storeQuickList = document.getElementById("storeQuickList");
const storeSetupContent = document.getElementById("storeSetupContent");
const storeSetupDefaultHint = document.getElementById("storeSetupDefaultHint");
const existingStoreSelectWrap = document.getElementById("existingStoreSelectWrap");
const storeNameInput = document.getElementById("storeNameInput");
const storeIdDisplay = document.getElementById("storeIdDisplay");
const storeAddressInput = document.getElementById("storeAddressInput");
const storeManagerInput = document.getElementById("storeManagerInput");
const storeOpenTimeInput = document.getElementById("storeOpenTimeInput");
const storeCloseTimeInput = document.getElementById("storeCloseTimeInput");
const storeUpiIdInput = document.getElementById("storeUpiIdInput");
const storeOpenDaysList = document.getElementById("storeOpenDaysList");
const storeEnabledMethodsList = document.getElementById("storeEnabledMethodsList");
const editStoreNameBtn = document.getElementById("editStoreNameBtn");
const editStoreAddressBtn = document.getElementById("editStoreAddressBtn");
const editStoreManagerBtn = document.getElementById("editStoreManagerBtn");
const editStoreTimingBtn = document.getElementById("editStoreTimingBtn");
const editStoreDaysBtn = document.getElementById("editStoreDaysBtn");
const editStorePaymentBtn = document.getElementById("editStorePaymentBtn");
const editStoreMenuBtn = document.getElementById("editStoreMenuBtn");
const saveStoreSectionBtn = document.getElementById("saveStoreSectionBtn");
const storeMenuSectionWrap = document.getElementById("storeMenuSectionWrap");
const storeMenuSelectionHint = document.getElementById("storeMenuSelectionHint");
const storeSummaryGrid = document.getElementById("storeSummaryGrid");
const storeMenuTableBody = document.getElementById("storeMenuTableBody");
const addStoreMenuItemBtn = document.getElementById("addStoreMenuItemBtn");
const storeMenuFileInput = document.getElementById("storeMenuFileInput");
const uploadStoreMenuBtn = document.getElementById("uploadStoreMenuBtn");
const storeOrdersBody = document.getElementById("storeOrdersBody");
const storeStatus = document.getElementById("storeStatus");
const storeSetupStatus = document.getElementById("storeSetupStatus");
const analyticsStoreSelectOrders = document.getElementById("analyticsStoreSelectOrders");
const outletCredStoreSelect = document.getElementById("outletCredStoreSelect");
const outletCredUsernameInput = document.getElementById("outletCredUsernameInput");
const outletCredPinInput = document.getElementById("outletCredPinInput");
const outletCredDisplayNameInput = document.getElementById("outletCredDisplayNameInput");
const saveOutletCredBtn = document.getElementById("saveOutletCredBtn");
const outletCredStatus = document.getElementById("outletCredStatus");
const outletCredTableBody = document.getElementById("outletCredTableBody");

const DEFAULT_METHODS = ["GPay", "PhonePe", "Paytm", "UPI", "Card", "Cash"];
const ADMIN_CREDENTIALS = { username: "admin", pin: "4321" };
const MAX_BRAND_LOGO_BYTES = 300 * 1024;
const ALL_WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

let availablePaymentMethods = [...DEFAULT_METHODS];
let refreshTimer = null;
let draftMenu = [];
let stores = [];
let selectedStoreId = "";
let selectedAnalyticsStoreId = "";
let draftStoreMenu = [];
let storeSetupMode = "none";
let storeEditState = { name: false, address: false, manager: false, timing: false, days: false, payment: false, menu: false };
let outletUsers = [];
let brandLogoDataUrl = "";
let analyticsRange = { preset: "last7", from: "", to: "" };
let analyticsViewMode = "insights";
let isBrandFormDirty = false;
let latestPublishStatus = null;
let charts = {
  networkValueTrend: null,
  networkPaymentMix: null,
  networkOrderStatus: null,
  storeValueTrend: null
};

const inrFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function metricCard(label, value) {
  return `
    <div class="menu-item admin-metric-card">
      <div class="admin-metric-label">${label}</div>
      <strong class="admin-metric-value">${value}</strong>
    </div>
  `;
}

function groupedDailyTotals(orderList) {
  const map = new Map();
  for (const order of Array.isArray(orderList) ? orderList : []) {
    const key = new Date(order.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    const current = map.get(key) || 0;
    map.set(key, current + Number(order.total || 0));
  }
  const labels = Array.from(map.keys());
  const values = labels.map((label) => Number((map.get(label) || 0).toFixed(2)));
  return { labels, values };
}

function destroyChartInstance(chart) {
  if (chart && typeof chart.destroy === "function") {
    chart.destroy();
  }
}

function renderNetworkCharts(orderList, summary) {
  if (typeof Chart === "undefined") return;
  const orders = Array.isArray(orderList) ? orderList : [];
  const { labels, values } = groupedDailyTotals(orders);

  destroyChartInstance(charts.networkValueTrend);
  charts.networkValueTrend = new Chart(networkValueTrendChartCanvas, {
    type: "line",
    data: {
      labels: labels.length ? labels : ["No data"],
      datasets: [
        {
          label: "Daily Order Value (INR)",
          data: values.length ? values : [0],
          borderColor: "#8b7f70",
          backgroundColor: "rgba(139, 127, 112, 0.12)",
          fill: true,
          tension: 0.35,
          pointRadius: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });

  const paymentBreakdown = summary?.paymentBreakdown || {};
  destroyChartInstance(charts.networkPaymentMix);
  charts.networkPaymentMix = new Chart(networkPaymentMixChartCanvas, {
    type: "doughnut",
    data: {
      labels: Object.keys(paymentBreakdown).length ? Object.keys(paymentBreakdown) : ["No data"],
      datasets: [
        {
          data: Object.keys(paymentBreakdown).length ? Object.values(paymentBreakdown) : [1],
          backgroundColor: ["#d9b9a6", "#b4c9b3", "#adc6cf", "#e0cdb2", "#c6b3d4", "#e7d4bf"],
          borderColor: "#f4f0e8",
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } }
    }
  });

  const readyCount = Number(summary?.readyCount || 0);
  const collectedCount = Number(summary?.collectedCount || 0);
  const pendingCount = Math.max(0, Number(summary?.totalOrders || 0) - readyCount - collectedCount);
  destroyChartInstance(charts.networkOrderStatus);
  charts.networkOrderStatus = new Chart(networkOrderStatusChartCanvas, {
    type: "bar",
    data: {
      labels: ["Ready", "Collected", "Other"],
      datasets: [
        {
          data: [readyCount, collectedCount, pendingCount],
          backgroundColor: ["#99bf9b", "#7fb0a2", "#ceb8a3"],
          borderRadius: 8
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

function renderStoreCharts(storeOrders) {
  if (typeof Chart === "undefined") return;
  const { labels, values } = groupedDailyTotals(storeOrders || []);
  destroyChartInstance(charts.storeValueTrend);
  charts.storeValueTrend = new Chart(storeValueTrendChartCanvas, {
    type: "line",
    data: {
      labels: labels.length ? labels : ["No store data"],
      datasets: [
        {
          label: "Store Daily Value (INR)",
          data: values.length ? values : [0],
          borderColor: "#7f9cb2",
          backgroundColor: "rgba(127, 156, 178, 0.14)",
          fill: true,
          tension: 0.3,
          pointRadius: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

function formatOrderItems(items) {
  if (!Array.isArray(items) || items.length === 0) return "-";
  return items.map((line) => `${line.itemId} x${line.quantity}`).join(", ");
}

function showStatus(target, message, type) {
  target.innerHTML = message ? `<div class="status ${type}">${message}</div>` : "";
}

function showBrandStatus(message, type) {
  showStatus(brandSetupStatus, message, type);
}

function showGatewayStatus(message, type) {
  showStatus(gatewaySetupStatus, message, type);
}

function showLoginStatus(message, type) {
  showStatus(adminLoginStatus, message, type);
}

function showStoreStatus(message, type) {
  showStatus(storeStatus, message, type);
}

function showStoreSetupStatus(message, type) {
  showStatus(storeSetupStatus, message, type);
}

function showAnalyticsRangeStatus(message, type) {
  showStatus(analyticsRangeStatus, message, type);
}

function showOutletCredStatus(message, type) {
  showStatus(outletCredStatus, message, type);
}

function showPanel(panel) {
  adminHomePanel.style.display = panel === "home" ? "block" : "none";
  analyticsPanel.style.display = panel === "analytics" ? "block" : "none";
  storesPanel.style.display = panel === "stores" ? "block" : "none";
  if (navHomeBtn) navHomeBtn.classList.toggle("admin-side-btn-active", panel === "home");
  if (navAnalyticsBtn) navAnalyticsBtn.classList.toggle("admin-side-btn-active", panel === "analytics");
  if (navStoresBtn) navStoresBtn.classList.toggle("admin-side-btn-active", panel === "stores");
  if (panel === "analytics") {
    setAnalyticsView(analyticsViewMode);
  }
}

function formatPublishDateTime(isoValue) {
  if (!isoValue) return "Never";
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return "Never";
  return date.toLocaleString();
}

function renderPublishStatus(status) {
  if (!publishChangesBtn || !publishMeta) return;
  const current = status || latestPublishStatus;
  if (!current) {
    publishMeta.textContent = "";
    publishChangesBtn.disabled = true;
    return;
  }
  latestPublishStatus = current;
  const hasUnpublishedChanges = Boolean(current.hasUnpublishedChanges);
  publishChangesBtn.disabled = !hasUnpublishedChanges;
  publishMeta.textContent = hasUnpublishedChanges
    ? "Draft changes pending. Click Publish Changes to push to customer app."
    : `Live on customer app. Last published: ${formatPublishDateTime(current.publishedAt)}`;
}

function normalizeMenuId(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getPresetRange(preset) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (preset === "today") {
    const val = formatDateInputValue(today);
    return { from: val, to: val };
  }
  if (preset === "last7") {
    const from = new Date(today);
    from.setDate(from.getDate() - 6);
    return { from: formatDateInputValue(from), to: formatDateInputValue(today) };
  }
  if (preset === "mtd") {
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: formatDateInputValue(from), to: formatDateInputValue(today) };
  }
  if (preset === "ytd") {
    const from = new Date(today.getFullYear(), 0, 1);
    return { from: formatDateInputValue(from), to: formatDateInputValue(today) };
  }
  if (preset === "previousMonth") {
    const startPrev = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endPrev = new Date(today.getFullYear(), today.getMonth(), 0);
    return { from: formatDateInputValue(startPrev), to: formatDateInputValue(endPrev) };
  }
  return { from: "", to: "" };
}

function buildAnalyticsQueryParams() {
  if (!analyticsRange.from || !analyticsRange.to) return "";
  const params = new URLSearchParams();
  params.set("dateFrom", analyticsRange.from);
  params.set("dateTo", analyticsRange.to);
  return `?${params.toString()}`;
}

function applyPresetToInputs(preset) {
  const range = getPresetRange(preset);
  analyticsDateFrom.value = range.from;
  analyticsDateTo.value = range.to;
}

function prettyPresetLabel(preset) {
  if (preset === "today") return "Today";
  if (preset === "last7") return "Last 7 Days";
  if (preset === "mtd") return "Month to Date";
  if (preset === "ytd") return "Year to Date";
  if (preset === "previousMonth") return "Previous Month";
  if (preset === "custom") return "Custom";
  return "All Time";
}

function updateAnalyticsRangeUi() {
  const isCustom = analyticsRangePreset.value === "custom";
  analyticsCustomRangeWrap.style.display = isCustom ? "block" : "none";
  applyAnalyticsRangeBtn.textContent = isCustom ? "Apply Custom Range" : "Apply Range";
  if (analyticsRange.from && analyticsRange.to) {
    analyticsRangeActiveLabel.textContent = `Active Range: ${prettyPresetLabel(analyticsRange.preset)} (${analyticsRange.from} to ${analyticsRange.to})`;
  } else {
    analyticsRangeActiveLabel.textContent = `Active Range: ${prettyPresetLabel(analyticsRange.preset)}`;
  }
}

function setAnalyticsView(mode) {
  analyticsViewMode = mode === "orders" ? "orders" : "insights";
  analyticsInsightsView.style.display = analyticsViewMode === "insights" ? "block" : "none";
  analyticsOrdersView.style.display = analyticsViewMode === "orders" ? "block" : "none";
  analyticsViewInsightsBtn.classList.toggle("admin-toggle-active", analyticsViewMode === "insights");
  analyticsViewOrdersBtn.classList.toggle("admin-toggle-active", analyticsViewMode === "orders");
}

async function applyAnalyticsRangeFromControls() {
  const preset = analyticsRangePreset.value;
  let from = analyticsDateFrom.value;
  let to = analyticsDateTo.value;

  if (preset !== "custom") {
    const presetRange = getPresetRange(preset);
    from = presetRange.from;
    to = presetRange.to;
    analyticsDateFrom.value = from;
    analyticsDateTo.value = to;
  }

  if (preset === "custom") {
    if (!from || !to) {
      showAnalyticsRangeStatus("Choose both From and To dates for custom range.", "error");
      return;
    }
    if (from > to) {
      showAnalyticsRangeStatus("From date cannot be later than To date.", "error");
      return;
    }
  }

  analyticsRange = { preset, from, to };
  updateAnalyticsRangeUi();
  showAnalyticsRangeStatus(
    from && to ? `Analytics updated for ${from} to ${to}.` : `Analytics updated for ${prettyPresetLabel(preset)}.`,
    "success"
  );
  await refreshAdminData();
}

function validateMenu(menu) {
  if (!Array.isArray(menu) || menu.length === 0) return "Menu must have at least one item.";
  for (const item of menu) {
    if (!item.name || !String(item.name).trim()) return "Each menu item needs a name.";
    const price = Number(item.price);
    if (!Number.isFinite(price) || price <= 0) return `Invalid price for "${item.name}".`;
  }
  return "";
}

function parseStoreMenuExcel(arrayBuffer) {
  if (typeof XLSX === "undefined") {
    throw new Error("Excel parser not loaded. Please refresh and try again.");
  }
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];
  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  return rows
    .map((row) => {
      const lowered = Object.fromEntries(Object.entries(row).map(([k, v]) => [String(k).trim().toLowerCase(), v]));
      const name = lowered.name ?? lowered.item ?? lowered.itemname ?? lowered.menuitem ?? "";
      const price = lowered.price ?? lowered.rate ?? lowered.amount ?? lowered.cost ?? 0;
      return { name: String(name || "").trim(), price: Number(price || 0) };
    })
    .filter((item) => item.name);
}

function renderSummary(summary) {
  summaryGrid.innerHTML = [
    metricCard("Total Orders", summary.totalOrders),
    metricCard("Total Value", `₹${inrFormatter.format(summary.totalValue)}`),
    metricCard("Average Order", `₹${inrFormatter.format(summary.averageOrderValue)}`),
    metricCard("Ready for Pickup", summary.readyCount),
    metricCard("Collected", summary.collectedCount)
  ].join("");

  paymentGrid.innerHTML = Object.entries(summary.paymentBreakdown || {})
    .map(([method, count]) => metricCard(method, count))
    .join("");
}

function renderOrders(orders) {
  if (!orders.length) {
    adminOrdersBody.innerHTML = `<tr><td colspan="6">No orders yet.</td></tr>`;
    return;
  }

  adminOrdersBody.innerHTML = orders
    .map((order) => {
      const time = new Date(order.createdAt).toLocaleTimeString();
      return `
        <tr>
          <td>${time}</td>
          <td>${order.customerName}</td>
          <td>${formatOrderItems(order.items)}</td>
          <td>₹${inrFormatter.format(Number(order.total))}</td>
          <td>${order.paymentMethod || "UPI"}</td>
          <td>${order.status}</td>
        </tr>
      `;
    })
    .join("");
}

function renderBrandConfig(paymentConfig) {
  if (isBrandFormDirty) {
    return;
  }
  const brandName = String(paymentConfig.brandName || "").trim();
  brandNameInput.value = brandName;
  if (brandName) {
    adminBrandHeader.textContent = brandName;
    adminBrandHeader.style.display = "block";
    if (adminBrandHeaderFallback) adminBrandHeaderFallback.style.display = "none";
  } else {
    adminBrandHeader.textContent = "";
    adminBrandHeader.style.display = "none";
    if (adminBrandHeaderFallback) adminBrandHeaderFallback.style.display = "block";
  }
  brandLogoDataUrl = String(paymentConfig.brandLogoDataUrl || paymentConfig.brandLogoUrl || "");
  brandLogoFileInput.value = "";
  useBrandLogoInput.checked = Boolean(paymentConfig.useBrandLogo);
  brandLogoFileInput.disabled = !useBrandLogoInput.checked;
  if (brandLogoDataUrl) {
    const approxKb = Math.ceil((brandLogoDataUrl.length * 3) / 4 / 1024);
    brandLogoMeta.textContent = `Logo uploaded (approx ${approxKb} KB).`;
  } else {
    brandLogoMeta.textContent = "No logo uploaded yet.";
  }
  if (gatewayModeSelect) {
    gatewayModeSelect.value = String(paymentConfig.paymentGatewayMode || "direct_upi").toLowerCase() === "razorpay" ? "razorpay" : "direct_upi";
  }
  if (razorpayKeyIdInput) razorpayKeyIdInput.value = String(paymentConfig.razorpayKeyId || "");
  if (razorpayKeySecretInput) razorpayKeySecretInput.value = String(paymentConfig.razorpayKeySecret || "");
  if (razorpayWebhookSecretInput) razorpayWebhookSecretInput.value = String(paymentConfig.razorpayWebhookSecret || "");
}

function renderStoreOpenDays(days = ALL_WEEK_DAYS) {
  const selectedDays = new Set(Array.isArray(days) && days.length ? days : ALL_WEEK_DAYS);
  storeOpenDaysList.innerHTML = ALL_WEEK_DAYS
    .map(
      (day) => `
        <label class="admin-method-item">
          <input type="checkbox" data-store-day="${day}" ${selectedDays.has(day) ? "checked" : ""} />
          <span>${day}</span>
        </label>
      `
    )
    .join("");
}

function renderStorePaymentMethods(methods = DEFAULT_METHODS) {
  const enabled = Array.isArray(methods) && methods.length ? methods : DEFAULT_METHODS;
  storeEnabledMethodsList.innerHTML = availablePaymentMethods
    .map(
      (method) => `
        <label class="admin-method-item">
          <input type="checkbox" data-store-payment="${method}" value="${method}" ${enabled.includes(method) ? "checked" : ""} />
          <span>${method}</span>
        </label>
      `
    )
    .join("");
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read logo file."));
    reader.readAsDataURL(file);
  });
}

async function buildBrandPayload() {
  const file = brandLogoFileInput.files && brandLogoFileInput.files[0];
  if (file) {
    if (file.size > MAX_BRAND_LOGO_BYTES) {
      throw new Error("Logo file is too large. Please upload up to 300 KB.");
    }
    if (!/^image\/(png|jpeg|webp)$/i.test(file.type || "")) {
      throw new Error("Invalid logo format. Use PNG, JPG, or WEBP.");
    }
    brandLogoDataUrl = await readFileAsDataUrl(file);
  }
  return {
    brandName: brandNameInput.value.trim(),
    customerAppName: brandNameInput.value.trim(),
    brandLogoDataUrl: brandLogoDataUrl,
    useBrandLogo: useBrandLogoInput.checked
  };
}

function getSelectedStoreOpenDays() {
  return Array.from(storeOpenDaysList.querySelectorAll("input[type='checkbox'][data-store-day]:checked")).map((input) =>
    String(input.getAttribute("data-store-day") || "").trim()
  );
}

function getSelectedStorePaymentMethods() {
  return Array.from(storeEnabledMethodsList.querySelectorAll("input[type='checkbox'][data-store-payment]:checked")).map((input) => input.value);
}


function renderStoreSelect() {
  const editorOptions = [`<option value="">-- Select a store --</option>`]
    .concat(stores.map((store) => `<option value="${store.id}" ${store.id === selectedStoreId ? "selected" : ""}>${store.name}</option>`));
  const analyticsOptions = [`<option value="">-- Select a store --</option>`]
    .concat(stores.map((store) => `<option value="${store.id}" ${store.id === selectedAnalyticsStoreId ? "selected" : ""}>${store.name}</option>`));
  storeSelect.innerHTML = editorOptions.join("");
  analyticsStoreSelect.innerHTML = analyticsOptions.join("");
  if (analyticsStoreSelectOrders) {
    analyticsStoreSelectOrders.innerHTML = analyticsOptions.join("");
  }
  if (outletCredStoreSelect) {
    outletCredStoreSelect.innerHTML = [`<option value="">-- Select a store --</option>`]
      .concat(stores.map((store) => `<option value="${store.id}">${store.name}</option>`))
      .join("");
  }
}

function renderOutletUsersTable() {
  if (!outletCredTableBody) return;
  if (!Array.isArray(outletUsers) || outletUsers.length === 0) {
    outletCredTableBody.innerHTML = `<tr><td colspan="4">No outlet credentials created yet.</td></tr>`;
    return;
  }
  outletCredTableBody.innerHTML = outletUsers
    .map((user) => {
      const createdAt = user.createdAt ? new Date(user.createdAt).toLocaleString() : "-";
      return `
        <tr>
          <td>${user.username || "-"}</td>
          <td>${user.storeName || user.storeId || "-"}</td>
          <td>${user.displayName || "-"}</td>
          <td>${createdAt}</td>
        </tr>
      `;
    })
    .join("");
}

function renderStoreQuickList() {
  if (!storeQuickList) return;
  const rows = stores
    .map(
      (store) => `
        <div class="admin-store-quick-row">
          <div class="admin-store-quick-meta">
            <p class="admin-store-quick-name">${store.name || "Unnamed Store"}</p>
            <p class="admin-store-quick-sub">${store.address || "-"} • ID: ${store.id}</p>
          </div>
          <div class="admin-store-quick-actions">
            <button type="button" data-store-quick-edit="${store.id}">Edit</button>
            <button type="button" data-store-quick-delete="${store.id}">Delete</button>
          </div>
        </div>
      `
    )
    .join("");

  storeQuickList.innerHTML = `
    ${rows || '<div class="admin-help-text">No stores yet.</div>'}
    <button type="button" class="admin-store-quick-add" id="storeQuickAddBtn">+ Add New Store</button>
  `;

  storeQuickList.querySelectorAll("button[data-store-quick-edit]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const storeId = String(btn.getAttribute("data-store-quick-edit") || "").trim();
      if (!storeId) return;
      selectedStoreId = storeId;
      setStoreSetupMode("existing");
      await loadStoreForEditor(storeId);
    });
  });

  storeQuickList.querySelectorAll("button[data-store-quick-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const storeId = String(btn.getAttribute("data-store-quick-delete") || "").trim();
      if (!storeId) return;
      const store = stores.find((entry) => entry.id === storeId);
      const storeName = store?.name || storeId;
      const confirmed = window.confirm(
        `Delete store "${storeName}"? This removes it from draft setup. Publish changes to remove it from customer app.`
      );
      if (!confirmed) return;
      try {
        const res = await fetch(`/api/admin/stores/${encodeURIComponent(storeId)}`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to delete store.");
        if (selectedStoreId === storeId) {
          selectedStoreId = "";
          clearStoreForm();
        }
        if (selectedAnalyticsStoreId === storeId) {
          selectedAnalyticsStoreId = "";
        }
        showStoreSetupStatus(`Store deleted: ${storeName}`, "success");
        await refreshAdminData();
      } catch (err) {
        showStoreSetupStatus(err.message, "error");
      }
    });
  });

  const addBtn = document.getElementById("storeQuickAddBtn");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      selectedStoreId = "";
      setStoreSetupMode("new");
      showStoreSetupStatus("", "success");
    });
  }
}

function renderStoreSummary(summary) {
  if (!summary) {
    storeSummaryGrid.innerHTML = metricCard("Store Performance", "Select a store");
    return;
  }
  storeSummaryGrid.innerHTML = [
    metricCard("Store Orders", summary.totalOrders),
    metricCard("Store Value", `₹${inrFormatter.format(summary.totalValue)}`),
    metricCard("Avg Order", `₹${inrFormatter.format(summary.averageOrderValue)}`),
    metricCard("Ready", summary.readyCount),
    metricCard("Collected", summary.collectedCount)
  ].join("");
}

function renderStoreOrders(storeOrders) {
  if (!Array.isArray(storeOrders) || storeOrders.length === 0) {
    storeOrdersBody.innerHTML = `<tr><td colspan="6">No orders for this store.</td></tr>`;
    return;
  }
  storeOrdersBody.innerHTML = storeOrders
    .map((order) => {
      const time = new Date(order.createdAt).toLocaleTimeString();
      return `
        <tr>
          <td>${time}</td>
          <td>${order.customerName}</td>
          <td>${formatOrderItems(order.items)}</td>
          <td>₹${inrFormatter.format(Number(order.total))}</td>
          <td>${order.paymentMethod || "UPI"}</td>
          <td>${order.status}</td>
        </tr>
      `;
    })
    .join("");
}

function renderStoreMenuTable() {
  const menuEditable = storeSetupMode === "new" || storeEditState.menu;
  const canRemoveMenuItems = storeSetupMode === "new" || (storeSetupMode === "existing" && Boolean(selectedStoreId));
  if (!draftStoreMenu.length) {
    storeMenuTableBody.innerHTML = `<tr><td colspan="3">No items. Add store menu items.</td></tr>`;
    return;
  }
  storeMenuTableBody.innerHTML = draftStoreMenu
    .map(
      (item, idx) => `
        <tr>
          <td><input data-store-menu-field="name" data-store-menu-idx="${idx}" value="${String(item.name || "").replace(/"/g, "&quot;")}" ${menuEditable ? "" : "disabled"} /></td>
          <td><input data-store-menu-field="price" data-store-menu-idx="${idx}" type="number" min="1" step="0.01" value="${Number(item.price || 0)}" ${menuEditable ? "" : "disabled"} /></td>
          <td><button type="button" data-store-menu-remove="${idx}" ${canRemoveMenuItems ? "" : "disabled"}>Remove</button></td>
        </tr>
      `
    )
    .join("");

  storeMenuTableBody.querySelectorAll("button[data-store-menu-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-store-menu-remove"));
      if (!Number.isInteger(idx)) return;
      if (storeSetupMode === "existing" && !storeEditState.menu) {
        // Auto-enable menu edit mode when first remove action is triggered.
        setStoreFieldEditable("menu", true);
      }
      draftStoreMenu = draftStoreMenu.filter((_, i) => i !== idx);
      renderStoreMenuTable();
    });
  });

  if (!menuEditable) return;

  storeMenuTableBody.querySelectorAll("input[data-store-menu-field]").forEach((input) => {
    input.addEventListener("input", () => {
      const idx = Number(input.getAttribute("data-store-menu-idx"));
      const field = input.getAttribute("data-store-menu-field");
      if (!Number.isInteger(idx) || idx < 0 || idx >= draftStoreMenu.length || !field) return;
      draftStoreMenu[idx][field] = field === "price" ? Number(input.value) : input.value;
    });
  });
}

function hasExistingStoreEdits() {
  return Object.values(storeEditState).some(Boolean);
}

function resetStoreEditState() {
  storeEditState = { name: false, address: false, manager: false, timing: false, days: false, payment: false, menu: false };
}

function setStoreFieldEditable(field, editable) {
  if (!["name", "address", "manager", "timing", "days", "payment", "menu"].includes(field)) return;
  storeEditState[field] = Boolean(editable);
  refreshStoreEditUi();
}

function refreshStoreEditUi() {
  const isExistingMode = storeSetupMode === "existing";
  const isNewMode = storeSetupMode === "new";

  const nameEditable = isNewMode || storeEditState.name;
  const addressEditable = isNewMode || storeEditState.address;
  const managerEditable = isNewMode || storeEditState.manager;
  const timingEditable = isNewMode || storeEditState.timing;
  const daysEditable = isNewMode || storeEditState.days;
  const paymentEditable = isNewMode || storeEditState.payment;
  const menuEditable = isNewMode || storeEditState.menu;

  storeNameInput.readOnly = !nameEditable;
  storeAddressInput.readOnly = !addressEditable;
  storeManagerInput.readOnly = !managerEditable;
  storeOpenTimeInput.disabled = !timingEditable;
  storeCloseTimeInput.disabled = !timingEditable;
  storeUpiIdInput.readOnly = !paymentEditable;
  storeNameInput.classList.toggle("admin-input-locked", !nameEditable);
  storeAddressInput.classList.toggle("admin-input-locked", !addressEditable);
  storeManagerInput.classList.toggle("admin-input-locked", !managerEditable);
  storeUpiIdInput.classList.toggle("admin-input-locked", !paymentEditable);
  addStoreMenuItemBtn.disabled = !menuEditable;
  uploadStoreMenuBtn.disabled = !menuEditable;
  storeOpenDaysList.querySelectorAll("input[type='checkbox'][data-store-day]").forEach((input) => {
    input.disabled = !daysEditable;
  });
  storeEnabledMethodsList.querySelectorAll("input[type='checkbox'][data-store-payment]").forEach((input) => {
    input.disabled = !paymentEditable;
  });

  editStoreNameBtn.style.display = isExistingMode || isNewMode ? "inline-flex" : "none";
  editStoreAddressBtn.style.display = isExistingMode || isNewMode ? "inline-flex" : "none";
  editStoreManagerBtn.style.display = isExistingMode || isNewMode ? "inline-flex" : "none";
  editStoreTimingBtn.style.display = isExistingMode || isNewMode ? "inline-flex" : "none";
  editStoreDaysBtn.style.display = isExistingMode || isNewMode ? "inline-flex" : "none";
  editStorePaymentBtn.style.display = isExistingMode || isNewMode ? "inline-flex" : "none";
  editStoreMenuBtn.style.display = isExistingMode || isNewMode ? "inline-flex" : "none";

  const disableFieldEditIcons = isExistingMode && !selectedStoreId;
  editStoreNameBtn.disabled = disableFieldEditIcons;
  editStoreAddressBtn.disabled = disableFieldEditIcons;
  editStoreManagerBtn.disabled = disableFieldEditIcons;
  editStoreTimingBtn.disabled = disableFieldEditIcons;
  editStoreDaysBtn.disabled = disableFieldEditIcons;
  editStorePaymentBtn.disabled = disableFieldEditIcons;
  editStoreMenuBtn.disabled = disableFieldEditIcons;

  if (isExistingMode) {
    // Keep enabled when a store is selected so click can show guided messages.
    saveStoreSectionBtn.disabled = !selectedStoreId;
  } else if (isNewMode) {
    // New store form is directly editable; do not block save behind edit toggles.
    saveStoreSectionBtn.disabled = false;
  } else {
    saveStoreSectionBtn.disabled = true;
  }

  if (isNewMode) {
    saveStoreSectionBtn.textContent = "Create Store";
  } else {
    saveStoreSectionBtn.textContent = "Save Store Setup";
  }

  renderStoreMenuTable();
  updateStoreMenuVisibility();
}

function updateStoreMenuVisibility() {
  if (!storeMenuSectionWrap || !storeMenuSelectionHint) return;
  const shouldShowMenu = storeSetupMode === "new" || (storeSetupMode === "existing" && Boolean(selectedStoreId));
  storeMenuSectionWrap.style.display = shouldShowMenu ? "block" : "none";
  storeMenuSelectionHint.style.display = shouldShowMenu ? "none" : "block";
}

function clearStoreForm() {
  storeIdDisplay.value = "";
  storeNameInput.value = "";
  storeAddressInput.value = "";
  storeManagerInput.value = "";
  storeOpenTimeInput.value = "08:00";
  storeCloseTimeInput.value = "22:00";
  storeUpiIdInput.value = "";
  draftStoreMenu = draftMenu.map((item) => ({ ...item }));
  renderStoreOpenDays(ALL_WEEK_DAYS);
  renderStorePaymentMethods(DEFAULT_METHODS);
  resetStoreEditState();
  refreshStoreEditUi();
}

function applyStoreSetupModeUi() {
  const isExistingMode = storeSetupMode === "existing";
  const isNewMode = storeSetupMode === "new";
  if (existingStoreModeBtn) existingStoreModeBtn.classList.toggle("active", isExistingMode);
  if (newStoreModeBtn) newStoreModeBtn.classList.toggle("active", isNewMode);
  storeSetupContent.style.display = isExistingMode || isNewMode ? "block" : "none";
  storeSetupDefaultHint.style.display = "none";

  existingStoreSelectWrap.style.display = "none";

  if (!isExistingMode && !isNewMode) {
    selectedStoreId = "";
    resetStoreEditState();
    clearStoreForm();
    refreshStoreEditUi();
    updateStoreMenuVisibility();
    showStoreSetupStatus("", "success");
    return;
  }

  if (isExistingMode) {
    resetStoreEditState();
    refreshStoreEditUi();
  } else {
    selectedStoreId = "";
    resetStoreEditState();
    clearStoreForm();
    refreshStoreEditUi();
  }
  updateStoreMenuVisibility();
  showStoreSetupStatus("", "success");
}

function setStoreSetupMode(mode) {
  storeSetupMode = mode === "new" ? "new" : mode === "existing" ? "existing" : "none";
  applyStoreSetupModeUi();
  if (storeSetupMode === "existing") {
    if (selectedStoreId) {
      loadStoreForEditor(selectedStoreId);
    } else {
      clearStoreForm();
    }
  }
}

async function refreshStoreAnalytics(storeId) {
  if (!storeId) {
    renderStoreSummary(null);
    renderStoreOrders([]);
    renderStoreCharts([]);
    return;
  }
  try {
    const params = new URLSearchParams();
    params.set("storeId", storeId);
    if (analyticsRange.from && analyticsRange.to) {
      params.set("dateFrom", analyticsRange.from);
      params.set("dateTo", analyticsRange.to);
    }
    const res = await fetch(`/api/admin/store-performance?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load store performance.");

    renderStoreSummary(data.store.summary);
    renderStoreOrders(data.orders || []);
    renderStoreCharts(data.orders || []);
    showStoreStatus("", "success");
  } catch (err) {
    showStoreStatus(err.message, "error");
  }
}

async function loadStoreForEditor(storeId) {
  if (!storeId) {
    clearStoreForm();
    resetStoreEditState();
    refreshStoreEditUi();
    updateStoreMenuVisibility();
    return;
  }
  try {
    const res = await fetch(`/api/admin/store-performance?storeId=${encodeURIComponent(storeId)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load store.");
    const store = data.store;
    selectedStoreId = store.id;
    storeIdDisplay.value = store.id || "";
    storeNameInput.value = store.name || "";
    storeAddressInput.value = store.address || "";
    storeManagerInput.value = store.managerName || "";
    storeOpenTimeInput.value = store.openTime || "08:00";
    storeCloseTimeInput.value = store.closeTime || "22:00";
    storeUpiIdInput.value = store.upiId || "";
    renderStoreOpenDays(store.openDays || ALL_WEEK_DAYS);
    renderStorePaymentMethods(store.enabledPaymentMethods || DEFAULT_METHODS);
    draftStoreMenu = Array.isArray(store.menu) ? store.menu.map((item) => ({ ...item })) : [];
    resetStoreEditState();
    refreshStoreEditUi();
    updateStoreMenuVisibility();
    showStoreSetupStatus("", "success");
  } catch (err) {
    showStoreSetupStatus(err.message, "error");
  }
}

async function saveBrandSetup() {
  saveBrandSetupBtn.disabled = true;
  try {
    const brandPayload = await buildBrandPayload();
    const res = await fetch("/api/admin/payment-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(brandPayload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to save brand setup.");
    isBrandFormDirty = false;
    renderBrandConfig(data.paymentConfig || {});
    showBrandStatus("Brand setup saved.", "success");
  } catch (err) {
    showBrandStatus(err.message, "error");
  } finally {
    saveBrandSetupBtn.disabled = false;
  }
}

async function saveGatewaySetup() {
  if (!saveGatewaySetupBtn) return;
  saveGatewaySetupBtn.disabled = true;
  try {
    const payload = {
      paymentGatewayMode: gatewayModeSelect?.value || "direct_upi",
      razorpayKeyId: razorpayKeyIdInput?.value?.trim() || "",
      razorpayKeySecret: razorpayKeySecretInput?.value?.trim() || "",
      razorpayWebhookSecret: razorpayWebhookSecretInput?.value?.trim() || ""
    };
    const res = await fetch("/api/admin/payment-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to save gateway setup.");
    showGatewayStatus("Gateway setup saved.", "success");
    renderBrandConfig(data.paymentConfig || {});
  } catch (err) {
    showGatewayStatus(err.message, "error");
  } finally {
    saveGatewaySetupBtn.disabled = false;
  }
}

async function publishChanges() {
  if (!publishChangesBtn) return;
  if (isBrandFormDirty) {
    showBrandStatus("Save Brand Setup first, then publish.", "error");
    showStoreSetupStatus("Save Brand Setup first, then publish.", "error");
    return;
  }
  publishChangesBtn.disabled = true;
  const originalLabel = publishChangesBtn.textContent;
  publishChangesBtn.textContent = "Publishing...";
  try {
    const res = await fetch("/api/admin/publish", { method: "POST" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to publish.");
    renderPublishStatus(data.publishStatus || null);
    showStoreSetupStatus("Changes published. Customer app now uses latest data.", "success");
  } catch (err) {
    showStoreSetupStatus(err.message, "error");
  } finally {
    publishChangesBtn.textContent = originalLabel || "Publish Changes";
    await refreshAdminData();
  }
}

async function saveOutletCredentials() {
  const storeId = String(outletCredStoreSelect?.value || "").trim();
  const username = String(outletCredUsernameInput?.value || "").trim().toLowerCase();
  const pin = String(outletCredPinInput?.value || "").trim();
  const displayName = String(outletCredDisplayNameInput?.value || "").trim();
  if (!storeId || !username || !pin) {
    showOutletCredStatus("Store, username and PIN are required.", "error");
    return;
  }

  if (saveOutletCredBtn) saveOutletCredBtn.disabled = true;
  try {
    const res = await fetch("/api/admin/outlet-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId, username, pin, displayName })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to save outlet credentials.");
    showOutletCredStatus(data.message || "Outlet credentials saved.", "success");
    if (outletCredPinInput) outletCredPinInput.value = "";
    await refreshAdminData();
  } catch (err) {
    showOutletCredStatus(err.message, "error");
  } finally {
    if (saveOutletCredBtn) saveOutletCredBtn.disabled = false;
  }
}


function addStoreMenuItem() {
  if (storeSetupMode === "existing" && !storeEditState.menu) {
    showStoreSetupStatus("Click the edit icon beside Store Menu first.", "error");
    return;
  }
  draftStoreMenu.push({ id: "", name: "", price: 0 });
  renderStoreMenuTable();
}

async function uploadStoreMenuExcel() {
  if (storeSetupMode === "existing" && !storeEditState.menu) {
    showStoreSetupStatus("Click the edit icon beside Store Menu first.", "error");
    return;
  }
  const file = storeMenuFileInput.files && storeMenuFileInput.files[0];
  if (!file) {
    showStoreSetupStatus("Choose an Excel file first.", "error");
    return;
  }
  try {
    const parsed = parseStoreMenuExcel(await file.arrayBuffer());
    if (!parsed.length) {
      showStoreSetupStatus("No valid rows found. Use columns like name and price.", "error");
      return;
    }
    const normalized = parsed.map((item) => ({
      id: normalizeMenuId(item.name),
      name: String(item.name || "").trim(),
      price: Number(item.price || 0)
    }));
    const validationError = validateMenu(normalized);
    if (validationError) {
      showStoreSetupStatus(validationError, "error");
      return;
    }
    draftStoreMenu = normalized;
    renderStoreMenuTable();
    showStoreSetupStatus("Store menu loaded from Excel. Click Save Store Setup to apply.", "success");
  } catch (err) {
    showStoreSetupStatus(`Could not parse Excel file: ${err.message}`, "error");
  }
}

async function createStore() {
  const payload = {
    name: storeNameInput.value.trim(),
    address: storeAddressInput.value.trim(),
    managerName: storeManagerInput.value.trim(),
    openDays: getSelectedStoreOpenDays(),
    openTime: storeOpenTimeInput.value,
    closeTime: storeCloseTimeInput.value,
    upiId: storeUpiIdInput.value.trim(),
    enabledPaymentMethods: getSelectedStorePaymentMethods(),
    menu: draftStoreMenu.map((item) => ({
      id: item.id || normalizeMenuId(item.name),
      name: String(item.name || "").trim(),
      price: Number(item.price || 0)
    }))
  };
  const validationError = validateMenu(payload.menu);
  if (validationError) {
    showStoreSetupStatus(validationError, "error");
    return;
  }

  saveStoreSectionBtn.disabled = true;
  try {
    const res = await fetch("/api/admin/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create store.");
    showStoreSetupStatus(`Store created. Store ID: ${data.store.id}`, "success");
    await refreshAdminData();
    selectedStoreId = data.store.id;
    selectedAnalyticsStoreId = data.store.id;
    storeIdDisplay.value = data.store.id || "";
    renderStoreSelect();
    setStoreSetupMode("existing");
    await loadStoreForEditor(selectedStoreId);
    await refreshStoreAnalytics(selectedAnalyticsStoreId);
  } catch (err) {
    showStoreSetupStatus(err.message, "error");
  } finally {
    refreshStoreEditUi();
  }
}

async function updateStore() {
  if (storeSetupMode === "existing" && !hasExistingStoreEdits()) {
    showStoreSetupStatus("No changes enabled. Click an edit icon first.", "error");
    return;
  }
  if (!selectedStoreId) {
    showStoreSetupStatus("Select a store first.", "error");
    return;
  }

  const payload = {
    name: storeNameInput.value.trim(),
    address: storeAddressInput.value.trim(),
    managerName: storeManagerInput.value.trim(),
    openDays: getSelectedStoreOpenDays(),
    openTime: storeOpenTimeInput.value,
    closeTime: storeCloseTimeInput.value,
    upiId: storeUpiIdInput.value.trim(),
    enabledPaymentMethods: getSelectedStorePaymentMethods(),
    menu: draftStoreMenu.map((item) => ({
      id: item.id || normalizeMenuId(item.name),
      name: String(item.name || "").trim(),
      price: Number(item.price || 0)
    }))
  };
  const validationError = validateMenu(payload.menu);
  if (validationError) {
    showStoreSetupStatus(validationError, "error");
    return;
  }

  saveStoreSectionBtn.disabled = true;
  try {
    const res = await fetch(`/api/admin/stores/${encodeURIComponent(selectedStoreId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update store.");
    showStoreSetupStatus(`Store updated: ${data.store.id}`, "success");
    resetStoreEditState();
    await refreshAdminData();
    await loadStoreForEditor(selectedStoreId);
    if (selectedAnalyticsStoreId === selectedStoreId) {
      await refreshStoreAnalytics(selectedAnalyticsStoreId);
    }
  } catch (err) {
    showStoreSetupStatus(err.message, "error");
  } finally {
    refreshStoreEditUi();
  }
}


async function refreshAdminData() {
  try {
    const res = await fetch(`/api/admin/summary${buildAnalyticsQueryParams()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load admin data.");

    renderSummary(data.summary || {});
    const networkOrders = Array.isArray(data.orders) ? data.orders : [];
    renderOrders(networkOrders);
    renderNetworkCharts(networkOrders, data.summary || {});

    draftMenu = Array.isArray(data.menu) ? data.menu.map((item) => ({ ...item })) : [];

    availablePaymentMethods = Array.isArray(data.availablePaymentMethods) && data.availablePaymentMethods.length
      ? data.availablePaymentMethods
      : [...DEFAULT_METHODS];
    renderBrandConfig(data.paymentConfig || {});
    renderPublishStatus(data.publishStatus || null);

    stores = Array.isArray(data.stores) ? data.stores : [];
    outletUsers = Array.isArray(data.outletUsers) ? data.outletUsers : [];
    if (selectedStoreId && !stores.some((store) => store.id === selectedStoreId)) {
      selectedStoreId = "";
    }
    if (selectedAnalyticsStoreId && !stores.some((store) => store.id === selectedAnalyticsStoreId)) {
      selectedAnalyticsStoreId = "";
    }
    renderStoreSelect();
    renderOutletUsersTable();
    renderStoreQuickList();
    if (selectedAnalyticsStoreId) {
      await refreshStoreAnalytics(selectedAnalyticsStoreId);
    } else {
      renderStoreSummary(null);
      renderStoreOrders([]);
      renderStoreCharts([]);
    }
  } catch (err) {
    summaryGrid.innerHTML = metricCard("Error", err.message);
    paymentGrid.innerHTML = "";
    adminOrdersBody.innerHTML = `<tr><td colspan="6">Failed to fetch admin data.</td></tr>`;
    showStoreStatus("Failed to load stores.", "error");
    renderPublishStatus(null);
    outletUsers = [];
    renderOutletUsersTable();
  }
}

function startAutoRefresh() {
  refreshAdminData();
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(refreshAdminData, 5000);
}

function logout() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  adminContent.style.display = "none";
  adminLoginCard.style.display = "block";
  adminPinInput.value = "";
  adminUsernameInput.value = "";
  showPanel("home");
  showLoginStatus("Logged out.", "success");
}

function login() {
  const username = adminUsernameInput.value.trim().toLowerCase();
  const pin = adminPinInput.value.trim();
  if (username === ADMIN_CREDENTIALS.username && pin === ADMIN_CREDENTIALS.pin) {
    adminLoginCard.style.display = "none";
    adminContent.style.display = "block";
    showPanel("home");
    adminUsernameInput.value = "";
    adminPinInput.value = "";
    showLoginStatus("", "success");
    startAutoRefresh();
    return;
  }
  showLoginStatus("Invalid admin credentials.", "error");
}

saveBrandSetupBtn.addEventListener("click", saveBrandSetup);
if (saveGatewaySetupBtn) {
  saveGatewaySetupBtn.addEventListener("click", saveGatewaySetup);
}
brandNameInput.addEventListener("input", () => {
  isBrandFormDirty = true;
});
useBrandLogoInput.addEventListener("change", () => {
  isBrandFormDirty = true;
  brandLogoFileInput.disabled = !useBrandLogoInput.checked;
  if (!useBrandLogoInput.checked) {
    showBrandStatus("", "success");
  }
});
brandLogoFileInput.addEventListener("change", () => {
  isBrandFormDirty = true;
  const file = brandLogoFileInput.files && brandLogoFileInput.files[0];
  if (!file) return;
  const kb = Math.ceil(file.size / 1024);
  brandLogoMeta.textContent = `${file.name} selected (${kb} KB).`;
});
adminLoginBtn.addEventListener("click", login);

if (existingStoreModeBtn) existingStoreModeBtn.addEventListener("click", () => setStoreSetupMode("existing"));
if (newStoreModeBtn) newStoreModeBtn.addEventListener("click", () => setStoreSetupMode("new"));
editStoreNameBtn.addEventListener("click", () => {
  if (storeSetupMode === "existing" && !selectedStoreId) return showStoreSetupStatus("Select a store first.", "error");
  setStoreFieldEditable("name", true);
  showStoreSetupStatus("Store Name is now editable.", "success");
});
editStoreAddressBtn.addEventListener("click", () => {
  if (storeSetupMode === "existing" && !selectedStoreId) return showStoreSetupStatus("Select a store first.", "error");
  setStoreFieldEditable("address", true);
  showStoreSetupStatus("Store Address is now editable.", "success");
});
editStoreManagerBtn.addEventListener("click", () => {
  if (storeSetupMode === "existing" && !selectedStoreId) return showStoreSetupStatus("Select a store first.", "error");
  setStoreFieldEditable("manager", true);
  showStoreSetupStatus("Store Manager is now editable.", "success");
});
editStoreTimingBtn.addEventListener("click", () => {
  if (storeSetupMode === "existing" && !selectedStoreId) return showStoreSetupStatus("Select a store first.", "error");
  setStoreFieldEditable("timing", true);
  showStoreSetupStatus("Store timings are now editable.", "success");
});
editStoreDaysBtn.addEventListener("click", () => {
  if (storeSetupMode === "existing" && !selectedStoreId) return showStoreSetupStatus("Select a store first.", "error");
  setStoreFieldEditable("days", true);
  showStoreSetupStatus("Open days are now editable.", "success");
});
editStorePaymentBtn.addEventListener("click", () => {
  if (storeSetupMode === "existing" && !selectedStoreId) return showStoreSetupStatus("Select a store first.", "error");
  setStoreFieldEditable("payment", true);
  showStoreSetupStatus("Store payment settings are now editable.", "success");
});
editStoreMenuBtn.addEventListener("click", () => {
  if (storeSetupMode === "existing" && !selectedStoreId) return showStoreSetupStatus("Select a store first.", "error");
  setStoreFieldEditable("menu", true);
  showStoreSetupStatus("Store Menu is now editable.", "success");
});
saveStoreSectionBtn.addEventListener("click", async () => {
  if (storeSetupMode === "new") {
    await createStore();
    return;
  }
  if (storeSetupMode === "existing") {
    await updateStore();
    return;
  }
  showStoreSetupStatus("Choose a store from the list or click Add New Store first.", "error");
});
addStoreMenuItemBtn.addEventListener("click", addStoreMenuItem);
uploadStoreMenuBtn.addEventListener("click", uploadStoreMenuExcel);

goAnalyticsBtn.addEventListener("click", () => showPanel("analytics"));
goStoresBtn.addEventListener("click", () => {
  showPanel("stores");
  setStoreSetupMode("none");
});
backFromAnalyticsBtn.addEventListener("click", () => showPanel("home"));
backFromStoresBtn.addEventListener("click", () => showPanel("home"));
if (navHomeBtn) navHomeBtn.addEventListener("click", () => showPanel("home"));
if (navAnalyticsBtn) navAnalyticsBtn.addEventListener("click", () => showPanel("analytics"));
if (navStoresBtn) {
  navStoresBtn.addEventListener("click", () => {
    showPanel("stores");
    setStoreSetupMode("none");
  });
}
if (navLogoutBtn) {
  navLogoutBtn.addEventListener("click", logout);
}
if (publishChangesBtn) {
  publishChangesBtn.addEventListener("click", publishChanges);
}
if (saveOutletCredBtn) {
  saveOutletCredBtn.addEventListener("click", saveOutletCredentials);
}
analyticsViewInsightsBtn.addEventListener("click", () => setAnalyticsView("insights"));
analyticsViewOrdersBtn.addEventListener("click", () => setAnalyticsView("orders"));

storeSelect.addEventListener("change", async () => {
  selectedStoreId = storeSelect.value;
  await loadStoreForEditor(selectedStoreId);
});

analyticsStoreSelect.addEventListener("change", async () => {
  selectedAnalyticsStoreId = analyticsStoreSelect.value;
  if (analyticsStoreSelectOrders) analyticsStoreSelectOrders.value = selectedAnalyticsStoreId;
  await refreshStoreAnalytics(selectedAnalyticsStoreId);
});
if (analyticsStoreSelectOrders) {
  analyticsStoreSelectOrders.addEventListener("change", async () => {
    selectedAnalyticsStoreId = analyticsStoreSelectOrders.value;
    analyticsStoreSelect.value = selectedAnalyticsStoreId;
    await refreshStoreAnalytics(selectedAnalyticsStoreId);
  });
}

analyticsRangePreset.addEventListener("change", () => {
  const preset = analyticsRangePreset.value;
  if (preset !== "custom") applyPresetToInputs(preset);
  updateAnalyticsRangeUi();
  if (preset !== "custom") {
    applyAnalyticsRangeFromControls();
  }
});

applyAnalyticsRangeBtn.addEventListener("click", applyAnalyticsRangeFromControls);

resetAnalyticsRangeBtn.addEventListener("click", async () => {
  analyticsRangePreset.value = "last7";
  applyPresetToInputs("last7");
  analyticsRange = { preset: "last7", from: analyticsDateFrom.value, to: analyticsDateTo.value };
  updateAnalyticsRangeUi();
  showAnalyticsRangeStatus("Range reset to Last 7 Days.", "success");
  await refreshAdminData();
});

adminPinInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") login();
});

applyStoreSetupModeUi();
applyPresetToInputs("last7");
analyticsRange = { preset: "last7", from: analyticsDateFrom.value, to: analyticsDateTo.value };
updateAnalyticsRangeUi();
setAnalyticsView("insights");
