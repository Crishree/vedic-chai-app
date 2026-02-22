const http = require("http");
const fs = require("fs");
const path = require("path");
const { randomUUID, randomBytes, scryptSync, timingSafeEqual } = require("crypto");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

let MENU_ITEMS = [
  { id: "chai-masala", name: "Masala Chai", price: 89 },
  { id: "chai-ginger", name: "Ginger Chai", price: 99 },
  { id: "samosa", name: "Samosa (2 pcs)", price: 79 },
  { id: "khaman", name: "Khaman Dhokla", price: 129 },
  { id: "bun-maska", name: "Bun Maska", price: 69 }
];
const ALL_PAYMENT_METHODS = ["GPay", "PhonePe", "Paytm", "UPI", "Card", "Cash"];
const ALL_WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CUSTOMER_APP_PALETTES = ["sand", "sage", "slate", "rosewood"];
const ADMIN_ROLES = ["owner", "ops", "finance"];
const paymentConfig = {
  brandName: "",
  useBrandLogo: false,
  brandLogoDataUrl: "",
  brandLogoUrl: "",
  customerPalette: "sand",
  customerAppName: "Your Brand Grab And Go",
  upiId: "",
  payeeName: "Your Brand",
  bankName: "",
  accountNumber: "",
  ifsc: "",
  enabledPaymentMethods: [...ALL_PAYMENT_METHODS],
  paymentGatewayMode: "direct_upi",
  razorpayKeyId: "",
  razorpayKeySecret: "",
  razorpayWebhookSecret: ""
};

const orders = [];
const stores = [];
const outletUsers = [];
const outletSessions = new Map();
const adminUsers = [];
const adminSessions = new Map();
const adminResetTokens = new Map();
const adminFirstLoginTokens = new Map();
const adminEmailOutbox = [];

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

let publishedState = {
  menu: deepClone(MENU_ITEMS),
  stores: deepClone(stores),
  paymentConfig: deepClone(paymentConfig),
  publishedAt: new Date().toISOString(),
  version: 1
};

function hasUnpublishedChanges() {
  return (
    JSON.stringify(MENU_ITEMS) !== JSON.stringify(publishedState.menu) ||
    JSON.stringify(stores) !== JSON.stringify(publishedState.stores) ||
    JSON.stringify(paymentConfig) !== JSON.stringify(publishedState.paymentConfig)
  );
}

function getPublishStatus() {
  return {
    hasUnpublishedChanges: hasUnpublishedChanges(),
    publishedAt: publishedState.publishedAt,
    publishedVersion: publishedState.version
  };
}

function publishDraftState() {
  publishedState = {
    menu: deepClone(MENU_ITEMS),
    stores: deepClone(stores),
    paymentConfig: deepClone(paymentConfig),
    publishedAt: new Date().toISOString(),
    version: Number(publishedState.version || 0) + 1
  };
  return getPublishStatus();
}

function sanitizeOutletUser(user) {
  const store = stores.find((entry) => entry.id === user.storeId);
  return {
    id: user.id,
    username: user.username,
    storeId: user.storeId,
    storeName: store?.name || "",
    displayName: user.displayName || "",
    createdAt: user.createdAt
  };
}

function getOutletSession(req) {
  const authHeader = String(req.headers.authorization || "").trim();
  if (!authHeader.toLowerCase().startsWith("bearer ")) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;
  const session = outletSessions.get(token);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    outletSessions.delete(token);
    return null;
  }
  return { token, ...session };
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeMobile(value) {
  const digits = String(value || "").replace(/\D+/g, "");
  if (!digits) return "";
  if (digits.length === 10) return digits;
  if (digits.length > 10) return digits.slice(-10);
  return digits;
}

function isValidMobile(mobile) {
  return /^\d{10}$/.test(String(mobile || "").trim());
}

function normalizeAdminRole(value) {
  const role = String(value || "").trim().toLowerCase();
  return ADMIN_ROLES.includes(role) ? role : "owner";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(String(password), salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function generateTemporaryPassword() {
  const chunk = randomBytes(6).toString("base64url").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
  return `Vc@${chunk}9`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = String(storedHash || "").split(":");
  if (!salt || !hash) return false;
  const computed = scryptSync(String(password), salt, 64).toString("hex");
  const hashBuffer = Buffer.from(hash, "hex");
  const computedBuffer = Buffer.from(computed, "hex");
  if (hashBuffer.length !== computedBuffer.length) return false;
  return timingSafeEqual(hashBuffer, computedBuffer);
}

function sanitizeAdminUser(user) {
  return {
    id: user.id,
    mobile: user.mobile || "",
    email: user.email,
    name: user.name || "",
    companyName: user.companyName || "",
    role: normalizeAdminRole(user.role),
    mustChangePassword: Boolean(user.mustChangePassword),
    status: user.status || "pending",
    createdAt: user.createdAt
  };
}

function hasAdminPermission(role, permission) {
  const normalizedRole = normalizeAdminRole(role);
  if (normalizedRole === "owner") return true;
  const map = {
    ops: new Set([
      "summary:read",
      "analytics:read",
      "publish:write",
      "stores:write",
      "stores:read",
      "outlet-users:read",
      "outlet-users:write",
      "menu:write"
    ]),
    finance: new Set([
      "summary:read",
      "analytics:read",
      "payment-config:write",
      "publish:write"
    ])
  };
  return Boolean(map[normalizedRole]?.has(permission));
}

function requireAdminPermission(req, res, permission) {
  const role = req?.adminSession?.role || "owner";
  if (hasAdminPermission(role, permission)) return true;
  sendJson(res, 403, { error: `Access denied for role "${role}" on ${permission}.` });
  return false;
}

function getAdminSession(req) {
  const authHeader = String(req.headers.authorization || "").trim();
  if (!authHeader.toLowerCase().startsWith("bearer ")) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;
  const session = adminSessions.get(token);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    adminSessions.delete(token);
    return null;
  }
  return { token, ...session };
}

function issueResetToken(userId) {
  const token = randomUUID().replace(/-/g, "");
  adminResetTokens.set(token, {
    userId,
    expiresAt: Date.now() + 1000 * 60 * 30
  });
  return token;
}

function getBaseUrl(req) {
  const host = String(req.headers.host || `localhost:${PORT}`).trim();
  const protoHeader = String(req.headers["x-forwarded-proto"] || "").trim().toLowerCase();
  const protocol = protoHeader === "https" ? "https" : "http";
  return `${protocol}://${host}`;
}

function queueAdminEmail(email) {
  adminEmailOutbox.unshift({
    ...email,
    id: randomUUID(),
    queuedAt: new Date().toISOString()
  });
  if (adminEmailOutbox.length > 30) {
    adminEmailOutbox.length = 30;
  }
  console.log(`[admin-email] to=${email.to} subject="${email.subject}"`);
  console.log(`[admin-email] preview=${email.previewUrl}`);
}

async function deliverAdminEmail(email) {
  const resendApiKey = String(process.env.RESEND_API_KEY || "").trim();
  const resendFrom = String(process.env.RESEND_FROM_EMAIL || "").trim();
  if (!resendApiKey || !resendFrom) {
    queueAdminEmail(email);
    return "preview";
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: resendFrom,
        to: [email.to],
        subject: email.subject,
        html: email.html || `<p>${email.subject}</p><p><a href="${email.previewUrl}">${email.previewUrl}</a></p>`
      })
    });
    if (!response.ok) {
      queueAdminEmail(email);
      return "preview";
    }
    return "email";
  } catch {
    queueAdminEmail(email);
    return "preview";
  }
}

async function sendAdminCredentials(user, req, subjectPrefix = "Admin Login Credentials") {
  const tempPassword = generateTemporaryPassword();
  user.passwordHash = hashPassword(tempPassword);
  user.mustChangePassword = true;
  user.status = user.status === "disabled" ? "disabled" : "active";
  const loginId = user.mobile || user.email || "";
  const subjectBrand = String(paymentConfig.brandName || "").trim() || "PikQuik";
  let delivery = "preview";
  if (user.email) {
    delivery = await deliverAdminEmail({
      to: user.email || "",
      subject: `${subjectBrand} ${subjectPrefix}`,
      html: `<p>Your account is ready.</p><p>Login ID: <b>${loginId}</b></p><p>Temporary Password: <b>${tempPassword}</b></p><p>Please change password after first login.</p>`,
      previewUrl: `${getBaseUrl(req)}/admin`
    });
  }
  return {
    delivery,
    loginId
  };
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8"
  };

  fs.readFile(filePath, (err, data) => {
    if (err) {
      sendJson(res, 404, { error: "Not found" });
      return;
    }
    res.writeHead(200, { "Content-Type": contentTypes[ext] || "application/octet-stream" });
    res.end(data);
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1e6) {
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function getOrderTotal(items) {
  const menuMap = new Map(MENU_ITEMS.map((item) => [item.id, item]));
  let total = 0;
  for (const line of items) {
    const menuItem = menuMap.get(line.itemId);
    if (!menuItem || !Number.isInteger(line.quantity) || line.quantity <= 0) {
      return null;
    }
    total += menuItem.price * line.quantity;
  }
  return Number(total.toFixed(2));
}

function getOrderTotalFromMenu(items, menuItems) {
  const menuMap = new Map((menuItems || []).map((item) => [item.id, item]));
  let total = 0;
  for (const line of items) {
    const menuItem = menuMap.get(line.itemId);
    if (!menuItem || !Number.isInteger(line.quantity) || line.quantity <= 0) {
      return null;
    }
    total += menuItem.price * line.quantity;
  }
  return Number(total.toFixed(2));
}

function normalizeMenuItemId(name, fallbackId) {
  const base = String(fallbackId || name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || `item-${Math.floor(Math.random() * 100000)}`;
}

function validateAndNormalizeMenu(rawMenu) {
  if (!Array.isArray(rawMenu) || rawMenu.length === 0) {
    return { ok: false, error: "menu must be a non-empty array." };
  }

  const seen = new Set();
  const normalized = [];
  for (const raw of rawMenu) {
    const name = String(raw?.name || "").trim();
    const price = Number(raw?.price);
    const id = normalizeMenuItemId(name, raw?.id);
    if (!name) return { ok: false, error: "Each menu item requires a name." };
    if (!Number.isFinite(price) || price <= 0) return { ok: false, error: `Invalid price for "${name}".` };
    if (seen.has(id)) return { ok: false, error: `Duplicate menu item id "${id}".` };
    seen.add(id);
    normalized.push({ id, name, price: Number(price.toFixed(2)) });
  }
  return { ok: true, menu: normalized };
}

function generateStoreId() {
  return `store-${randomUUID().slice(0, 8)}`;
}

function parseDateRange(searchParams) {
  const rawFrom = String(searchParams.get("dateFrom") || "").trim();
  const rawTo = String(searchParams.get("dateTo") || "").trim();
  if (!rawFrom || !rawTo) return { fromDate: null, toDate: null };
  const fromDate = new Date(`${rawFrom}T00:00:00`);
  const toDate = new Date(`${rawTo}T23:59:59.999`);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || fromDate > toDate) {
    return { error: "Invalid date range. Use dateFrom and dateTo as YYYY-MM-DD with dateFrom <= dateTo." };
  }
  return { fromDate, toDate };
}

function filterOrdersByDate(sourceOrders, fromDate, toDate) {
  if (!fromDate || !toDate) return sourceOrders;
  return sourceOrders.filter((order) => {
    const createdAt = new Date(order.createdAt);
    return createdAt >= fromDate && createdAt <= toDate;
  });
}

function getStoreSummary(storeId, sourceOrders = orders) {
  const storeOrders = sourceOrders.filter((order) => order.outletId === storeId);
  const totalOrders = storeOrders.length;
  const totalValue = storeOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const readyCount = storeOrders.filter((order) => order.status === "READY_FOR_PICKUP").length;
  const collectedCount = storeOrders.filter((order) => order.status === "COLLECTED").length;
  return {
    totalOrders,
    totalValue: Number(totalValue.toFixed(2)),
    averageOrderValue: totalOrders ? Number((totalValue / totalOrders).toFixed(2)) : 0,
    readyCount,
    collectedCount
  };
}

function normalizeStoreInput(body) {
  const name = String(body?.name || "").trim();
  const address = String(body?.address || "").trim();
  const managerName = String(body?.managerName || "").trim();
  const menuResult = body?.menu ? validateAndNormalizeMenu(body.menu) : { ok: true, menu: MENU_ITEMS.map((item) => ({ ...item })) };
  if (!name || !address || !managerName) {
    return { ok: false, error: "name, address and managerName are required." };
  }
  if (!menuResult.ok) {
    return { ok: false, error: menuResult.error };
  }
  const openDays = Array.isArray(body?.openDays)
    ? body.openDays.map((day) => String(day || "").trim()).filter((day) => ALL_WEEK_DAYS.includes(day))
    : ALL_WEEK_DAYS;
  const openTime = String(body?.openTime || "").trim();
  const closeTime = String(body?.closeTime || "").trim();
  const upiId = String(body?.upiId || "").trim();
  const enabledPaymentMethods = Array.isArray(body?.enabledPaymentMethods)
    ? body.enabledPaymentMethods
        .map((method) => String(method || "").trim())
        .filter((method) => ALL_PAYMENT_METHODS.includes(method))
    : [...ALL_PAYMENT_METHODS];
  const paymentGatewayMode = String(body?.paymentGatewayMode || "direct_upi").trim().toLowerCase();
  const validGatewayMode = paymentGatewayMode === "razorpay" ? "razorpay" : "direct_upi";

  if (openDays.length === 0) {
    return { ok: false, error: "Select at least one open day." };
  }
  if (!/^\d{2}:\d{2}$/.test(openTime) || !/^\d{2}:\d{2}$/.test(closeTime)) {
    return { ok: false, error: "openTime and closeTime must be in HH:MM format." };
  }
  if (enabledPaymentMethods.length === 0) {
    return { ok: false, error: "Select at least one payment method." };
  }
  const requiresWalletDetails = enabledPaymentMethods.some((method) => method !== "Cash");
  if (requiresWalletDetails && !upiId) {
    return { ok: false, error: "upiId is required when non-cash payment methods are enabled." };
  }

  return {
    ok: true,
    store: {
      name,
      address,
      managerName,
      menu: menuResult.menu,
      openDays,
      openTime,
      closeTime,
      upiId,
      enabledPaymentMethods,
      paymentGatewayMode: validGatewayMode
    }
  };
}

function getPublicPaymentConfig(config) {
  const source = config || paymentConfig;
  return {
    ...source,
    razorpayKeySecret: "",
    razorpayWebhookSecret: ""
  };
}

function getAdminSummary(sourceOrders = orders) {
  const totalOrders = sourceOrders.length;
  const totalValue = sourceOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const readyCount = sourceOrders.filter((order) => order.status === "READY_FOR_PICKUP").length;
  const collectedCount = sourceOrders.filter((order) => order.status === "COLLECTED").length;

  const paymentBreakdown = ALL_PAYMENT_METHODS.reduce((acc, method) => {
    acc[method] = 0;
    return acc;
  }, {});
  for (const order of sourceOrders) {
    const method = paymentBreakdown[order.paymentMethod] !== undefined ? order.paymentMethod : "UPI";
    paymentBreakdown[method] += 1;
  }

  return {
    totalOrders,
    totalValue: Number(totalValue.toFixed(2)),
    averageOrderValue: totalOrders ? Number((totalValue / totalOrders).toFixed(2)) : 0,
    readyCount,
    collectedCount,
    paymentBreakdown
  };
}

function handleApi(req, res, parsedUrl) {
  if (req.method === "GET" && parsedUrl.pathname === "/api/menu") {
    const outletId = (parsedUrl.searchParams.get("outletId") || "").trim();
    const liveStores = Array.isArray(publishedState.stores) ? publishedState.stores : [];
    const liveMenu = Array.isArray(publishedState.menu) ? publishedState.menu : [];
    if (outletId) {
      const store = liveStores.find((entry) => entry.id === outletId);
      if (store && Array.isArray(store.menu) && store.menu.length) {
        return sendJson(res, 200, { menu: store.menu, publishStatus: getPublishStatus() });
      }
    }
    return sendJson(res, 200, { menu: liveMenu, publishStatus: getPublishStatus() });
  }

  if (req.method === "GET" && parsedUrl.pathname === "/api/stores") {
    const liveStores = Array.isArray(publishedState.stores) ? publishedState.stores : [];
    return sendJson(res, 200, {
      stores: liveStores.map((store) => ({
        id: store.id,
        name: store.name,
        address: store.address,
        managerName: store.managerName,
        openDays: store.openDays || [],
        openTime: store.openTime || "",
        closeTime: store.closeTime || ""
      }))
    });
  }

  if (req.method === "POST" && parsedUrl.pathname === "/api/outlet/login") {
    return readBody(req)
      .then((body) => {
        const username = String(body?.username || "").trim().toLowerCase();
        const pin = String(body?.pin || "").trim();
        if (!username || !pin) {
          return sendJson(res, 400, { error: "username and pin are required." });
        }
        const user = outletUsers.find((entry) => entry.username.toLowerCase() === username && entry.pin === pin);
        if (!user) {
          return sendJson(res, 401, { error: "Invalid outlet credentials." });
        }
        const store = stores.find((entry) => entry.id === user.storeId);
        if (!store) {
          return sendJson(res, 400, { error: "Assigned store for this outlet user is missing." });
        }
        const token = randomUUID();
        outletSessions.set(token, {
          userId: user.id,
          username: user.username,
          storeId: user.storeId,
          expiresAt: Date.now() + 1000 * 60 * 60 * 12
        });
        return sendJson(res, 200, {
          token,
          profile: {
            username: user.username,
            storeId: user.storeId,
            storeName: store.name,
            displayName: user.displayName || ""
          }
        });
      })
      .catch((err) => sendJson(res, 400, { error: err.message }));
  }

  if (req.method === "GET" && parsedUrl.pathname === "/api/outlet/me") {
    const session = getOutletSession(req);
    if (!session) {
      return sendJson(res, 401, { error: "Unauthorized outlet session." });
    }
    const user = outletUsers.find((entry) => entry.id === session.userId);
    const store = stores.find((entry) => entry.id === session.storeId);
    if (!user || !store) {
      return sendJson(res, 401, { error: "Outlet profile is no longer available." });
    }
    return sendJson(res, 200, {
      profile: {
        username: user.username,
        storeId: user.storeId,
        storeName: store.name,
        displayName: user.displayName || ""
      }
    });
  }

  if (req.method === "GET" && parsedUrl.pathname === "/api/outlet/orders") {
    const session = getOutletSession(req);
    if (!session) {
      return sendJson(res, 401, { error: "Unauthorized outlet session." });
    }
    const storeOrders = orders.filter((order) => order.outletId === session.storeId);
    return sendJson(res, 200, { orders: storeOrders });
  }

  if (req.method === "POST" && parsedUrl.pathname === "/api/outlet/verify-pickup") {
    const session = getOutletSession(req);
    if (!session) {
      return sendJson(res, 401, { error: "Unauthorized outlet session." });
    }
    return readBody(req)
      .then((body) => {
        const code = (body.pickupCode || "").trim().toUpperCase();
        if (!code) {
          return sendJson(res, 400, { error: "pickupCode is required." });
        }
        const order = orders.find((entry) => entry.pickupCode === code && entry.outletId === session.storeId);
        if (!order) {
          return sendJson(res, 404, { error: "No order found for this code in your store." });
        }
        if (order.status === "COLLECTED") {
          return sendJson(res, 409, { error: "Order already collected." });
        }
        order.status = "COLLECTED";
        order.collectedAt = new Date().toISOString();
        return sendJson(res, 200, { message: "Order verified and handed over.", order });
      })
      .catch((err) => sendJson(res, 400, { error: err.message }));
  }

  if (req.method === "POST" && parsedUrl.pathname === "/api/orders") {
    return readBody(req)
      .then((body) => {
        const { customerName, phone, items, paymentMethod, outletId, outletName } = body;
        if (!customerName || !phone || !Array.isArray(items) || items.length === 0) {
          return sendJson(res, 400, { error: "customerName, phone and items are required." });
        }
        const liveStores = Array.isArray(publishedState.stores) ? publishedState.stores : [];
        const liveMenu = Array.isArray(publishedState.menu) ? publishedState.menu : [];
        const storeForOrder = liveStores.find((entry) => entry.id === String(outletId || "").trim());
        const enabledMethods = Array.isArray(storeForOrder?.enabledPaymentMethods) && storeForOrder.enabledPaymentMethods.length
          ? storeForOrder.enabledPaymentMethods
          : ALL_PAYMENT_METHODS;
        const paymentGatewayMode = String(storeForOrder?.paymentGatewayMode || paymentConfig.paymentGatewayMode || "direct_upi");
        if (paymentMethod && !enabledMethods.includes(paymentMethod)) {
          return sendJson(res, 400, { error: "Invalid payment method." });
        }

        const total = getOrderTotalFromMenu(items, storeForOrder?.menu || liveMenu);
        if (total === null) {
          return sendJson(res, 400, { error: "Invalid order items." });
        }

        const pickupCode = `VC-${Math.floor(100000 + Math.random() * 900000)}`;
        const order = {
          id: randomUUID(),
          customerName,
          phone,
          outletId: String(outletId || "").trim(),
          outletName: String(outletName || "").trim(),
          items,
          total,
          paid: true,
          paymentMethod: paymentMethod || enabledMethods[0] || "UPI",
          paymentGateway: paymentGatewayMode,
          paymentStatus: paymentGatewayMode === "razorpay" ? "created" : "captured",
          gatewayOrderId: "",
          gatewayPaymentId: "",
          gatewaySignature: "",
          status: "READY_FOR_PICKUP",
          pickupCode,
          createdAt: new Date().toISOString()
        };
        orders.unshift(order);

        return sendJson(res, 201, { order });
      })
      .catch((err) => sendJson(res, 400, { error: err.message }));
  }

  if (req.method === "GET" && parsedUrl.pathname === "/api/orders") {
    return sendJson(res, 200, { orders });
  }

  if (req.method === "GET" && parsedUrl.pathname === "/api/payment-config") {
    const outletId = (parsedUrl.searchParams.get("outletId") || "").trim();
    const liveStores = Array.isArray(publishedState.stores) ? publishedState.stores : [];
    const livePaymentConfig = publishedState.paymentConfig || paymentConfig;
    const store = liveStores.find((entry) => entry.id === outletId);
    const storePaymentConfig = store
      ? {
          upiId: store.upiId || "",
          paymentGatewayMode: store.paymentGatewayMode || paymentConfig.paymentGatewayMode || "direct_upi",
          enabledPaymentMethods:
            Array.isArray(store.enabledPaymentMethods) && store.enabledPaymentMethods.length
              ? store.enabledPaymentMethods
              : [...ALL_PAYMENT_METHODS]
        }
      : {
          upiId: livePaymentConfig.upiId || "",
          paymentGatewayMode: livePaymentConfig.paymentGatewayMode || "direct_upi",
          enabledPaymentMethods:
            Array.isArray(livePaymentConfig.enabledPaymentMethods) && livePaymentConfig.enabledPaymentMethods.length
              ? livePaymentConfig.enabledPaymentMethods
              : [...ALL_PAYMENT_METHODS]
        };

    return sendJson(res, 200, {
      paymentConfig: {
        ...getPublicPaymentConfig(livePaymentConfig),
        upiId: storePaymentConfig.upiId,
        paymentGatewayMode: storePaymentConfig.paymentGatewayMode,
        enabledPaymentMethods: storePaymentConfig.enabledPaymentMethods
      },
      availablePaymentMethods: ALL_PAYMENT_METHODS,
      publishStatus: getPublishStatus()
    });
  }

  if (req.method === "POST" && parsedUrl.pathname === "/api/admin/auth/signup") {
    return readBody(req)
      .then(async (body) => {
        const mobile = normalizeMobile(body?.mobile);
        const email = normalizeEmail(body?.email);
        const name = String(body?.name || "").trim();
        const companyName = String(body?.companyName || "").trim();
        // Public signup always provisions an owner account.
        const role = "owner";
        if (!mobile || !email || !companyName) {
          return sendJson(res, 400, { error: "mobile, email and companyName are required." });
        }
        if (!isValidMobile(mobile)) {
          return sendJson(res, 400, { error: "Enter a valid 10-digit mobile number." });
        }
        if (!isValidEmail(email)) {
          return sendJson(res, 400, { error: "Enter a valid email." });
        }

        let user = adminUsers.find((entry) => entry.mobile === mobile);
        if (!user) {
          user = {
            id: randomUUID(),
            mobile,
            email,
            name,
            companyName,
            role,
            status: "active",
            passwordHash: "",
            mustChangePassword: true,
            createdAt: new Date().toISOString(),
            invitedAt: "",
            activatedAt: ""
          };
          adminUsers.push(user);
        } else {
          user.mobile = mobile;
          user.name = name || user.name;
          user.email = email || user.email;
          user.companyName = companyName || user.companyName;
          user.role = role || user.role || "owner";
          user.status = user.status === "disabled" ? "disabled" : "active";
        }

        const { delivery, loginId } = await sendAdminCredentials(user, req, "Signup Credentials");

        return sendJson(res, 201, {
          message: "Signup successful. Login credentials generated.",
          delivery,
          loginId,
          admin: sanitizeAdminUser(user)
        });
      })
      .catch((err) => sendJson(res, 400, { error: err.message }));
  }

  if (req.method === "POST" && parsedUrl.pathname === "/api/admin/auth/login") {
    return readBody(req)
      .then((body) => {
        const rawLogin = String(body?.mobile || body?.loginId || body?.email || "").trim();
        const email = normalizeEmail(rawLogin);
        const mobile = normalizeMobile(rawLogin);
        const password = String(body?.password || "").trim();
        if (!rawLogin || !password) {
          return sendJson(res, 400, { error: "mobile/loginId and password are required." });
        }
        const user = rawLogin.includes("@")
          ? adminUsers.find((entry) => normalizeEmail(entry.email) === email)
          : adminUsers.find((entry) => normalizeMobile(entry.mobile) === mobile);
        if (!user || !user.passwordHash || user.status !== "active" || !verifyPassword(password, user.passwordHash)) {
          return sendJson(res, 401, { error: "Invalid admin credentials." });
        }
        if (user.mustChangePassword) {
          const firstLoginToken = randomUUID().replace(/-/g, "");
          adminFirstLoginTokens.set(firstLoginToken, {
            userId: user.id,
            expiresAt: Date.now() + 1000 * 60 * 15
          });
          return sendJson(res, 200, {
            mustChangePassword: true,
            firstLoginToken,
            admin: sanitizeAdminUser(user),
            message: "Password change required before dashboard access."
          });
        }
        const token = randomUUID();
        adminSessions.set(token, {
          userId: user.id,
          email: user.email,
          role: normalizeAdminRole(user.role),
          expiresAt: Date.now() + 1000 * 60 * 60 * 12
        });
        return sendJson(res, 200, {
          token,
          admin: sanitizeAdminUser(user),
          permissions: {
            canManageStores: hasAdminPermission(user.role, "stores:write"),
            canManagePayments: hasAdminPermission(user.role, "payment-config:write"),
            canManageOutletUsers: hasAdminPermission(user.role, "outlet-users:write")
          }
        });
      })
      .catch((err) => sendJson(res, 400, { error: err.message }));
  }

  if (req.method === "POST" && parsedUrl.pathname === "/api/admin/auth/change-password-first-login") {
    return readBody(req)
      .then((body) => {
        const token = String(body?.firstLoginToken || "").trim();
        const newPassword = String(body?.newPassword || "").trim();
        if (!token || !newPassword) {
          return sendJson(res, 400, { error: "firstLoginToken and newPassword are required." });
        }
        if (newPassword.length < 8) {
          return sendJson(res, 400, { error: "Password must be at least 8 characters." });
        }
        const session = adminFirstLoginTokens.get(token);
        if (!session || session.expiresAt <= Date.now()) {
          adminFirstLoginTokens.delete(token);
          return sendJson(res, 400, { error: "First-login token is invalid or expired." });
        }
        const user = adminUsers.find((entry) => entry.id === session.userId && entry.status === "active");
        if (!user) {
          adminFirstLoginTokens.delete(token);
          return sendJson(res, 404, { error: "Admin user not found." });
        }
        user.passwordHash = hashPassword(newPassword);
        user.mustChangePassword = false;
        user.activatedAt = user.activatedAt || new Date().toISOString();
        adminFirstLoginTokens.delete(token);

        const authToken = randomUUID();
        adminSessions.set(authToken, {
          userId: user.id,
          email: user.email,
          role: normalizeAdminRole(user.role),
          expiresAt: Date.now() + 1000 * 60 * 60 * 12
        });
        return sendJson(res, 200, {
          token: authToken,
          admin: sanitizeAdminUser(user),
          permissions: {
            canManageStores: hasAdminPermission(user.role, "stores:write"),
            canManagePayments: hasAdminPermission(user.role, "payment-config:write"),
            canManageOutletUsers: hasAdminPermission(user.role, "outlet-users:write")
          }
        });
      })
      .catch((err) => sendJson(res, 400, { error: err.message }));
  }

  if (req.method === "GET" && parsedUrl.pathname === "/api/admin/auth/me") {
    const session = getAdminSession(req);
    if (!session) {
      return sendJson(res, 401, { error: "Unauthorized admin session." });
    }
    const user = adminUsers.find((entry) => entry.id === session.userId);
    if (!user || user.status !== "active") {
      return sendJson(res, 401, { error: "Admin account unavailable." });
    }
    return sendJson(res, 200, {
      admin: sanitizeAdminUser(user),
      permissions: {
        canManageStores: hasAdminPermission(user.role, "stores:write"),
        canManagePayments: hasAdminPermission(user.role, "payment-config:write"),
        canManageOutletUsers: hasAdminPermission(user.role, "outlet-users:write")
      }
    });
  }

  if (req.method === "POST" && parsedUrl.pathname === "/api/admin/auth/logout") {
    const session = getAdminSession(req);
    if (session) {
      adminSessions.delete(session.token);
    }
    return sendJson(res, 200, { message: "Logged out." });
  }

  if (req.method === "POST" && parsedUrl.pathname === "/api/admin/auth/forgot-password") {
    return readBody(req)
      .then(async (body) => {
        const rawLogin = String(body?.mobile || body?.loginId || body?.email || "").trim();
        if (!rawLogin) {
          return sendJson(res, 400, { error: "Enter your mobile/loginId." });
        }
        const user = rawLogin.includes("@")
          ? adminUsers.find((entry) => normalizeEmail(entry.email) === normalizeEmail(rawLogin) && entry.status === "active")
          : adminUsers.find((entry) => normalizeMobile(entry.mobile) === normalizeMobile(rawLogin) && entry.status === "active");
        if (!user) {
          return sendJson(res, 200, { message: "If this login is registered, credentials were sent." });
        }
        const { delivery, loginId } = await sendAdminCredentials(user, req, "Reset Credentials");
        return sendJson(res, 200, {
          message: "If this login is registered, credentials were sent.",
          delivery,
          loginId
        });
      })
      .catch((err) => sendJson(res, 400, { error: err.message }));
  }

  if (req.method === "POST" && parsedUrl.pathname === "/api/admin/auth/reset-password") {
    return readBody(req)
      .then((body) => {
        const token = String(body?.token || "").trim();
        const password = String(body?.password || "").trim();
        if (!token || !password) {
          return sendJson(res, 400, { error: "token and password are required." });
        }
        if (password.length < 8) {
          return sendJson(res, 400, { error: "Password must be at least 8 characters." });
        }
        const reset = adminResetTokens.get(token);
        if (!reset || reset.expiresAt <= Date.now()) {
          adminResetTokens.delete(token);
          return sendJson(res, 400, { error: "Reset token is invalid or expired." });
        }
        const user = adminUsers.find((entry) => entry.id === reset.userId && entry.status === "active");
        if (!user) {
          adminResetTokens.delete(token);
          return sendJson(res, 404, { error: "Admin user not found." });
        }
        user.passwordHash = hashPassword(password);
        user.mustChangePassword = false;
        adminResetTokens.delete(token);
        return sendJson(res, 200, { message: "Password updated. Please login." });
      })
      .catch((err) => sendJson(res, 400, { error: err.message }));
  }

  if (parsedUrl.pathname.startsWith("/api/admin/") && !parsedUrl.pathname.startsWith("/api/admin/auth/")) {
    const adminSession = getAdminSession(req);
    if (!adminSession) {
      return sendJson(res, 401, { error: "Unauthorized admin session." });
    }
    const user = adminUsers.find((entry) => entry.id === adminSession.userId);
    if (!user || user.status !== "active") {
      return sendJson(res, 401, { error: "Admin account unavailable." });
    }
    adminSession.role = normalizeAdminRole(user.role);
    req.adminSession = adminSession;
  }

  if (req.method === "POST" && parsedUrl.pathname === "/api/verify-pickup") {
    return readBody(req)
      .then((body) => {
        const code = (body.pickupCode || "").trim().toUpperCase();
        if (!code) {
          return sendJson(res, 400, { error: "pickupCode is required." });
        }

        const order = orders.find((entry) => entry.pickupCode === code);
        if (!order) {
          return sendJson(res, 404, { error: "No order found for this code." });
        }
        if (order.status === "COLLECTED") {
          return sendJson(res, 409, { error: "Order already collected." });
        }

        order.status = "COLLECTED";
        order.collectedAt = new Date().toISOString();
        return sendJson(res, 200, { message: "Order verified and handed over.", order });
      })
      .catch((err) => sendJson(res, 400, { error: err.message }));
  }

  if (req.method === "GET" && parsedUrl.pathname === "/api/admin/users") {
    if (!requireAdminPermission(req, res, "admin-users:read")) return;
    return sendJson(res, 200, {
      users: adminUsers.map((user) => sanitizeAdminUser(user))
    });
  }

  if (req.method === "POST" && parsedUrl.pathname === "/api/admin/users") {
    if (!requireAdminPermission(req, res, "admin-users:write")) return;
    return readBody(req)
      .then(async (body) => {
        const mobile = normalizeMobile(body?.mobile);
        const email = normalizeEmail(body?.email);
        const name = String(body?.name || "").trim();
        const companyName = String(body?.companyName || "").trim();
        const role = normalizeAdminRole(body?.role);
        if (!mobile || !email || !companyName) {
          return sendJson(res, 400, { error: "mobile, email and companyName are required." });
        }
        if (!isValidMobile(mobile)) {
          return sendJson(res, 400, { error: "Enter a valid 10-digit mobile number." });
        }
        if (!isValidEmail(email)) {
          return sendJson(res, 400, { error: "Enter a valid email." });
        }

        let user = adminUsers.find((entry) => normalizeMobile(entry.mobile) === mobile);
        if (!user) {
          user = {
            id: randomUUID(),
            mobile,
            email,
            name,
            companyName,
            role,
            status: "active",
            passwordHash: "",
            mustChangePassword: true,
            createdAt: new Date().toISOString(),
            invitedAt: "",
            activatedAt: ""
          };
          adminUsers.push(user);
        } else {
          user.mobile = mobile;
          user.name = name || user.name;
          user.email = email || user.email;
          user.companyName = companyName || user.companyName;
          user.role = role || user.role || "owner";
          if (user.status === "disabled") user.status = "active";
        }

        const { delivery, loginId } = await sendAdminCredentials(user, req, "Admin Credentials");
        return sendJson(res, 201, {
          message: "Admin user saved and credentials sent.",
          delivery,
          loginId,
          user: sanitizeAdminUser(user)
        });
      })
      .catch((err) => sendJson(res, 400, { error: err.message }));
  }

  if (req.method === "POST" && parsedUrl.pathname.startsWith("/api/admin/users/") && parsedUrl.pathname.endsWith("/resend-invite")) {
    if (!requireAdminPermission(req, res, "admin-users:write")) return;
    const id = decodeURIComponent(parsedUrl.pathname.replace("/api/admin/users/", "").replace("/resend-invite", "")).trim();
    const user = adminUsers.find((entry) => entry.id === id);
    if (!user) return sendJson(res, 404, { error: "Admin user not found." });
    return sendAdminCredentials(user, req, "Admin Credentials")
      .then(({ delivery, loginId }) =>
        sendJson(res, 200, {
          message: "Credentials resent.",
          delivery,
          loginId,
          user: sanitizeAdminUser(user)
        })
      )
      .catch((err) => sendJson(res, 400, { error: err.message }));
  }

  if (req.method === "PUT" && parsedUrl.pathname.startsWith("/api/admin/users/")) {
    if (!requireAdminPermission(req, res, "admin-users:write")) return;
    const id = decodeURIComponent(parsedUrl.pathname.replace("/api/admin/users/", "")).trim();
    if (!id || id.includes("/")) return sendJson(res, 404, { error: "Admin user not found." });
    return readBody(req)
      .then((body) => {
        const user = adminUsers.find((entry) => entry.id === id);
        if (!user) return sendJson(res, 404, { error: "Admin user not found." });

        const nextRole = body?.role !== undefined ? normalizeAdminRole(body.role) : user.role;
        const nextStatus = body?.status !== undefined ? String(body.status || "").trim().toLowerCase() : user.status;
        const validStatus = ["pending", "active", "disabled"].includes(nextStatus) ? nextStatus : user.status;

        const activeOwnerCount = adminUsers.filter((entry) => normalizeAdminRole(entry.role) === "owner" && entry.status !== "disabled").length;
        const userIsOwner = normalizeAdminRole(user.role) === "owner" && user.status !== "disabled";
        const ownerWouldBeRemoved = userIsOwner && (nextRole !== "owner" || validStatus === "disabled");
        if (ownerWouldBeRemoved && activeOwnerCount <= 1) {
          return sendJson(res, 400, { error: "At least one owner account must remain active." });
        }

        user.name = body?.name !== undefined ? String(body.name || "").trim() : user.name;
        if (body?.mobile !== undefined) {
          const nextMobile = normalizeMobile(body.mobile);
          if (!isValidMobile(nextMobile)) {
            return sendJson(res, 400, { error: "Enter a valid 10-digit mobile number." });
          }
          const exists = adminUsers.find((entry) => entry.id !== user.id && normalizeMobile(entry.mobile) === nextMobile);
          if (exists) {
            return sendJson(res, 400, { error: "Mobile number already used by another admin user." });
          }
          user.mobile = nextMobile;
        }
        if (body?.email !== undefined) {
          const nextEmail = normalizeEmail(body.email);
          if (nextEmail && !isValidEmail(nextEmail)) {
            return sendJson(res, 400, { error: "Enter a valid email." });
          }
          user.email = nextEmail;
        }
        user.companyName = body?.companyName !== undefined ? String(body.companyName || "").trim() : user.companyName;
        user.role = nextRole;
        user.status = validStatus;
        if (validStatus === "disabled") {
          for (const [token, session] of adminSessions.entries()) {
            if (session.userId === user.id) adminSessions.delete(token);
          }
        }

        return sendJson(res, 200, { message: "Admin user updated.", user: sanitizeAdminUser(user) });
      })
      .catch((err) => sendJson(res, 400, { error: err.message }));
  }

  if (req.method === "DELETE" && parsedUrl.pathname.startsWith("/api/admin/users/")) {
    if (!requireAdminPermission(req, res, "admin-users:write")) return;
    const id = decodeURIComponent(parsedUrl.pathname.replace("/api/admin/users/", "")).trim();
    if (!id || id.includes("/")) return sendJson(res, 404, { error: "Admin user not found." });
    if (req.adminSession?.userId === id) {
      return sendJson(res, 400, { error: "You cannot delete your own admin account." });
    }
    const idx = adminUsers.findIndex((entry) => entry.id === id);
    if (idx < 0) return sendJson(res, 404, { error: "Admin user not found." });
    const user = adminUsers[idx];
    const activeOwnerCount = adminUsers.filter((entry) => normalizeAdminRole(entry.role) === "owner" && entry.status !== "disabled").length;
    if (normalizeAdminRole(user.role) === "owner" && user.status !== "disabled" && activeOwnerCount <= 1) {
      return sendJson(res, 400, { error: "At least one owner account must remain active." });
    }
    adminUsers.splice(idx, 1);
    for (const [token, session] of adminSessions.entries()) {
      if (session.userId === user.id) adminSessions.delete(token);
    }
    return sendJson(res, 200, { message: "Admin user deleted.", user: sanitizeAdminUser(user) });
  }

  if (req.method === "GET" && parsedUrl.pathname === "/api/admin/summary") {
    if (!requireAdminPermission(req, res, "summary:read")) return;
    const range = parseDateRange(parsedUrl.searchParams);
    if (range.error) {
      return sendJson(res, 400, { error: range.error });
    }
    const filteredOrders = filterOrdersByDate(orders, range.fromDate, range.toDate);
    return sendJson(res, 200, {
      summary: getAdminSummary(filteredOrders),
      orders: filteredOrders,
      paymentConfig,
      menu: MENU_ITEMS,
      publishStatus: getPublishStatus(),
      outletUsers: outletUsers.map((user) => sanitizeOutletUser(user)),
      stores: stores.map((store) => ({
        ...store,
        summary: getStoreSummary(store.id, filteredOrders)
      })),
      availablePaymentMethods: ALL_PAYMENT_METHODS
    });
  }

  if (req.method === "GET" && parsedUrl.pathname === "/api/publish-status") {
    return sendJson(res, 200, { publishStatus: getPublishStatus() });
  }

  if (req.method === "POST" && parsedUrl.pathname === "/api/admin/publish") {
    if (!requireAdminPermission(req, res, "publish:write")) return;
    const publishStatus = publishDraftState();
    return sendJson(res, 200, {
      message: "Changes published to customer app.",
      publishStatus
    });
  }

  if (req.method === "POST" && parsedUrl.pathname === "/api/admin/menu") {
    if (!requireAdminPermission(req, res, "menu:write")) return;
    return readBody(req)
      .then((body) => {
        const result = validateAndNormalizeMenu(body.menu);
        if (!result.ok) {
          return sendJson(res, 400, { error: result.error });
        }
        MENU_ITEMS = result.menu;
        return sendJson(res, 200, { message: "Menu updated.", menu: MENU_ITEMS });
      })
      .catch((err) => sendJson(res, 400, { error: err.message }));
  }

  if (req.method === "POST" && parsedUrl.pathname === "/api/admin/stores") {
    if (!requireAdminPermission(req, res, "stores:write")) return;
    return readBody(req)
      .then((body) => {
        const normalized = normalizeStoreInput(body);
        if (!normalized.ok) {
          return sendJson(res, 400, { error: normalized.error });
        }
        const id = generateStoreId();
        const store = { id, ...normalized.store, createdAt: new Date().toISOString() };
        stores.push(store);
        return sendJson(res, 201, { message: "Store created.", store: { ...store, summary: getStoreSummary(store.id) } });
      })
      .catch((err) => sendJson(res, 400, { error: err.message }));
  }

  if (req.method === "PUT" && parsedUrl.pathname.startsWith("/api/admin/stores/")) {
    if (!requireAdminPermission(req, res, "stores:write")) return;
    return readBody(req)
      .then((body) => {
        const storeId = decodeURIComponent(parsedUrl.pathname.replace("/api/admin/stores/", "")).trim();
        const store = stores.find((entry) => entry.id === storeId);
        if (!store) {
          return sendJson(res, 404, { error: "Store not found." });
        }
        const normalized = normalizeStoreInput(body);
        if (!normalized.ok) {
          return sendJson(res, 400, { error: normalized.error });
        }
        Object.assign(store, normalized.store);
        return sendJson(res, 200, { message: "Store updated.", store: { ...store, summary: getStoreSummary(store.id) } });
      })
      .catch((err) => sendJson(res, 400, { error: err.message }));
  }

  if (req.method === "DELETE" && parsedUrl.pathname.startsWith("/api/admin/stores/")) {
    if (!requireAdminPermission(req, res, "stores:write")) return;
    const storeId = decodeURIComponent(parsedUrl.pathname.replace("/api/admin/stores/", "")).trim();
    const storeIndex = stores.findIndex((entry) => entry.id === storeId);
    if (storeIndex < 0) {
      return sendJson(res, 404, { error: "Store not found." });
    }
    const [deletedStore] = stores.splice(storeIndex, 1);
    for (let i = outletUsers.length - 1; i >= 0; i -= 1) {
      if (outletUsers[i].storeId === deletedStore.id) {
        outletUsers.splice(i, 1);
      }
    }
    return sendJson(res, 200, { message: "Store deleted.", store: deletedStore });
  }

  if (req.method === "GET" && parsedUrl.pathname === "/api/admin/outlet-users") {
    if (!requireAdminPermission(req, res, "outlet-users:read")) return;
    return sendJson(res, 200, { outletUsers: outletUsers.map((user) => sanitizeOutletUser(user)) });
  }

  if (req.method === "POST" && parsedUrl.pathname === "/api/admin/outlet-users") {
    if (!requireAdminPermission(req, res, "outlet-users:write")) return;
    return readBody(req)
      .then((body) => {
        const username = String(body?.username || "").trim().toLowerCase();
        const pin = String(body?.pin || "").trim();
        const storeId = String(body?.storeId || "").trim();
        const displayName = String(body?.displayName || "").trim();
        if (!username || !pin || !storeId) {
          return sendJson(res, 400, { error: "username, pin and storeId are required." });
        }
        if (pin.length < 4) {
          return sendJson(res, 400, { error: "PIN must be at least 4 characters." });
        }
        const store = stores.find((entry) => entry.id === storeId);
        if (!store) {
          return sendJson(res, 404, { error: "Store not found for outlet credentials." });
        }
        const existing = outletUsers.find((entry) => entry.username.toLowerCase() === username);
        if (existing) {
          existing.pin = pin;
          existing.storeId = storeId;
          existing.displayName = displayName;
          return sendJson(res, 200, {
            message: "Outlet credentials updated.",
            outletUser: sanitizeOutletUser(existing)
          });
        }
        const user = {
          id: randomUUID(),
          username,
          pin,
          storeId,
          displayName,
          createdAt: new Date().toISOString()
        };
        outletUsers.push(user);
        return sendJson(res, 201, {
          message: "Outlet credentials created.",
          outletUser: sanitizeOutletUser(user)
        });
      })
      .catch((err) => sendJson(res, 400, { error: err.message }));
  }

  if (req.method === "GET" && parsedUrl.pathname === "/api/admin/store-performance") {
    if (!requireAdminPermission(req, res, "analytics:read")) return;
    const storeId = (parsedUrl.searchParams.get("storeId") || "").trim();
    if (!storeId) {
      return sendJson(res, 400, { error: "storeId is required." });
    }
    const range = parseDateRange(parsedUrl.searchParams);
    if (range.error) {
      return sendJson(res, 400, { error: range.error });
    }
    const store = stores.find((entry) => entry.id === storeId);
    if (!store) {
      return sendJson(res, 404, { error: "Store not found." });
    }
    const storeOrders = filterOrdersByDate(orders, range.fromDate, range.toDate).filter((order) => order.outletId === storeId);
    return sendJson(res, 200, {
      store: { ...store, summary: getStoreSummary(store.id, storeOrders) },
      orders: storeOrders
    });
  }

  if (req.method === "POST" && parsedUrl.pathname === "/api/admin/payment-config") {
    if (!requireAdminPermission(req, res, "payment-config:write")) return;
    return readBody(req)
      .then((body) => {
        const hasBrandName = Object.prototype.hasOwnProperty.call(body, "brandName");
        const hasCustomerAppName = Object.prototype.hasOwnProperty.call(body, "customerAppName");
        const nextBrandName = hasBrandName
          ? String(body.brandName || "").trim()
          : hasCustomerAppName
            ? String(body.customerAppName || "").trim()
            : String(paymentConfig.brandName || "").trim();
        const nextUseBrandLogo = body.useBrandLogo !== undefined ? Boolean(body.useBrandLogo) : Boolean(paymentConfig.useBrandLogo);
        const nextBrandLogoDataUrl =
          body.brandLogoDataUrl !== undefined ? String(body.brandLogoDataUrl || "").trim() : String(paymentConfig.brandLogoDataUrl || "").trim();
        const nextBrandLogoUrl = body.brandLogoUrl !== undefined ? String(body.brandLogoUrl || "").trim() : String(paymentConfig.brandLogoUrl || "").trim();
        const requestedPalette = body.customerPalette !== undefined ? String(body.customerPalette || "").trim().toLowerCase() : "";
        const nextCustomerPalette = CUSTOMER_APP_PALETTES.includes(requestedPalette)
          ? requestedPalette
          : String(paymentConfig.customerPalette || "sand");
        const requestedGatewayMode = String(body.paymentGatewayMode || paymentConfig.paymentGatewayMode || "direct_upi").trim().toLowerCase();
        const nextPaymentGatewayMode = requestedGatewayMode === "razorpay" ? "razorpay" : "direct_upi";
        const derivedPayeeName = nextBrandName || "Your Brand";
        const nextConfig = {
          brandName: nextBrandName,
          useBrandLogo: nextUseBrandLogo,
          brandLogoDataUrl: nextBrandLogoDataUrl,
          brandLogoUrl: nextBrandLogoUrl,
          customerPalette: nextCustomerPalette,
          customerAppName: nextBrandName ? `${nextBrandName} Grab And Go` : "",
          upiId: paymentConfig.upiId,
          payeeName:
            body.payeeName !== undefined
              ? String(body.payeeName || "").trim() || derivedPayeeName
              : derivedPayeeName,
          bankName: body.bankName !== undefined ? String(body.bankName || "").trim() : paymentConfig.bankName,
          accountNumber: body.accountNumber !== undefined ? String(body.accountNumber || "").trim() : paymentConfig.accountNumber,
          ifsc: body.ifsc !== undefined ? String(body.ifsc || "").trim().toUpperCase() : paymentConfig.ifsc,
          enabledPaymentMethods: Array.isArray(paymentConfig.enabledPaymentMethods) ? paymentConfig.enabledPaymentMethods : [...ALL_PAYMENT_METHODS],
          paymentGatewayMode: nextPaymentGatewayMode,
          razorpayKeyId: body.razorpayKeyId !== undefined ? String(body.razorpayKeyId || "").trim() : String(paymentConfig.razorpayKeyId || "").trim(),
          razorpayKeySecret:
            body.razorpayKeySecret !== undefined ? String(body.razorpayKeySecret || "").trim() : String(paymentConfig.razorpayKeySecret || "").trim(),
          razorpayWebhookSecret:
            body.razorpayWebhookSecret !== undefined
              ? String(body.razorpayWebhookSecret || "").trim()
              : String(paymentConfig.razorpayWebhookSecret || "").trim()
        };
        if (nextConfig.brandLogoDataUrl && nextConfig.brandLogoDataUrl.length > 450000) {
          return sendJson(res, 400, { error: "Uploaded logo is too large. Keep it within 300 KB." });
        }
        if (nextConfig.useBrandLogo && !nextConfig.brandLogoDataUrl && !nextConfig.brandLogoUrl) {
          return sendJson(res, 400, { error: "Upload a brand logo when logo mode is enabled." });
        }
        Object.assign(paymentConfig, nextConfig);
        return sendJson(res, 200, { message: "Payment configuration updated.", paymentConfig });
      })
      .catch((err) => sendJson(res, 400, { error: err.message }));
  }

  if (req.method === "POST" && parsedUrl.pathname === "/api/payments/razorpay/webhook") {
    // Scaffold endpoint for future Razorpay webhook signature verification and event processing.
    return sendJson(res, 202, { message: "Webhook scaffold received. Razorpay event handling not enabled yet." });
  }

  return sendJson(res, 404, { error: "API route not found." });
}

const server = http.createServer((req, res) => {
  const host = req.headers.host || `localhost:${PORT}`;
  const parsedUrl = new URL(req.url, `http://${host}`);

  if (parsedUrl.pathname.startsWith("/api/")) {
    return handleApi(req, res, parsedUrl);
  }

  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  if (parsedUrl.pathname === "/") {
    return sendFile(res, path.join(PUBLIC_DIR, "landing.html"));
  }
  if (parsedUrl.pathname === "/customer" || parsedUrl.pathname === "/app") {
    return sendFile(res, path.join(PUBLIC_DIR, "customer.html"));
  }
  if (parsedUrl.pathname === "/outlet") {
    return sendFile(res, path.join(PUBLIC_DIR, "outlet.html"));
  }
  if (parsedUrl.pathname === "/admin") {
    return sendFile(res, path.join(PUBLIC_DIR, "admin.html"));
  }

  const requestedPath = decodeURIComponent(parsedUrl.pathname);
  const safeRelativePath = path
    .normalize(requestedPath)
    .replace(/^([/\\])+/, "")
    .replace(/^(\.\.[/\\])+/, "");
  const resolvedPath = path.resolve(PUBLIC_DIR, safeRelativePath);
  if (!resolvedPath.startsWith(PUBLIC_DIR + path.sep) && resolvedPath !== PUBLIC_DIR) {
    return sendJson(res, 403, { error: "Forbidden path." });
  }
  return sendFile(res, resolvedPath);
});

server.listen(PORT, () => {
  console.log(`Vedic Chai pre-order app running at http://localhost:${PORT}`);
});
