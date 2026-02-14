const http = require("http");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

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
  enabledPaymentMethods: [...ALL_PAYMENT_METHODS]
};

const orders = [];
const stores = [
  {
    id: "blr-koramangala",
    name: "Vedic Chai - Koramangala",
    address: "Koramangala, Bengaluru",
    managerName: "Store Manager",
    menu: MENU_ITEMS.map((item) => ({ ...item })),
    openDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    openTime: "08:00",
    closeTime: "22:00",
    upiId: "vedicchai.koramangala@upi",
    enabledPaymentMethods: [...ALL_PAYMENT_METHODS],
    createdAt: new Date().toISOString()
  },
  {
    id: "blr-indiranagar",
    name: "Vedic Chai - Indiranagar",
    address: "Indiranagar, Bengaluru",
    managerName: "Store Manager",
    menu: MENU_ITEMS.map((item) => ({ ...item })),
    openDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    openTime: "08:00",
    closeTime: "22:00",
    upiId: "vedicchai.indiranagar@upi",
    enabledPaymentMethods: [...ALL_PAYMENT_METHODS],
    createdAt: new Date().toISOString()
  },
  {
    id: "blr-hsr",
    name: "Vedic Chai - HSR",
    address: "HSR Layout, Bengaluru",
    managerName: "Store Manager",
    menu: MENU_ITEMS.map((item) => ({ ...item })),
    openDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    openTime: "08:00",
    closeTime: "22:00",
    upiId: "vedicchai.hsr@upi",
    enabledPaymentMethods: [...ALL_PAYMENT_METHODS],
    createdAt: new Date().toISOString()
  },
  {
    id: "blr-whitefield",
    name: "Vedic Chai - Whitefield",
    address: "Whitefield, Bengaluru",
    managerName: "Store Manager",
    menu: MENU_ITEMS.map((item) => ({ ...item })),
    openDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    openTime: "08:00",
    closeTime: "22:00",
    upiId: "vedicchai.whitefield@upi",
    enabledPaymentMethods: [...ALL_PAYMENT_METHODS],
    createdAt: new Date().toISOString()
  },
  {
    id: "blr-jayanagar",
    name: "Vedic Chai - Jayanagar",
    address: "Jayanagar, Bengaluru",
    managerName: "Store Manager",
    menu: MENU_ITEMS.map((item) => ({ ...item })),
    openDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    openTime: "08:00",
    closeTime: "22:00",
    upiId: "vedicchai.jayanagar@upi",
    enabledPaymentMethods: [...ALL_PAYMENT_METHODS],
    createdAt: new Date().toISOString()
  }
];

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
      enabledPaymentMethods
    }
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
          enabledPaymentMethods:
            Array.isArray(store.enabledPaymentMethods) && store.enabledPaymentMethods.length
              ? store.enabledPaymentMethods
              : [...ALL_PAYMENT_METHODS]
        }
      : {
          upiId: livePaymentConfig.upiId || "",
          enabledPaymentMethods:
            Array.isArray(livePaymentConfig.enabledPaymentMethods) && livePaymentConfig.enabledPaymentMethods.length
              ? livePaymentConfig.enabledPaymentMethods
              : [...ALL_PAYMENT_METHODS]
        };

    return sendJson(res, 200, {
      paymentConfig: {
        ...livePaymentConfig,
        upiId: storePaymentConfig.upiId,
        enabledPaymentMethods: storePaymentConfig.enabledPaymentMethods
      },
      availablePaymentMethods: ALL_PAYMENT_METHODS,
      publishStatus: getPublishStatus()
    });
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

  if (req.method === "GET" && parsedUrl.pathname === "/api/admin/summary") {
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
    const publishStatus = publishDraftState();
    return sendJson(res, 200, {
      message: "Changes published to customer app.",
      publishStatus
    });
  }

  if (req.method === "POST" && parsedUrl.pathname === "/api/admin/menu") {
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
    const storeId = decodeURIComponent(parsedUrl.pathname.replace("/api/admin/stores/", "")).trim();
    const storeIndex = stores.findIndex((entry) => entry.id === storeId);
    if (storeIndex < 0) {
      return sendJson(res, 404, { error: "Store not found." });
    }
    const [deletedStore] = stores.splice(storeIndex, 1);
    return sendJson(res, 200, { message: "Store deleted.", store: deletedStore });
  }

  if (req.method === "GET" && parsedUrl.pathname === "/api/admin/store-performance") {
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
          enabledPaymentMethods: Array.isArray(paymentConfig.enabledPaymentMethods) ? paymentConfig.enabledPaymentMethods : [...ALL_PAYMENT_METHODS]
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

  if (parsedUrl.pathname === "/" || parsedUrl.pathname === "/customer") {
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
