import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PAYMENT_METHODS = ["GPay", "PhonePe", "Paytm", "UPI", "Card"];
const APP_TYPES = {
  CUSTOMER: "customer",
  OUTLET: "outlet",
  ADMIN: "admin"
};

const STORAGE_KEYS = {
  outletName: "vedic_outlet_name",
  backendUrl: "vedic_backend_url"
};

const DEMO_CREDENTIALS = {
  outlet: { username: "outlet", pin: "1234" },
  admin: { username: "admin", pin: "4321" }
};

const inrFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function formatInr(value) {
  return `₹${inrFormatter.format(Number(value || 0))}`;
}

function normalizeBaseUrl(url) {
  return (url || "").trim().replace(/\/+$/, "");
}

const EMPTY_SUMMARY = {
  totalOrders: 0,
  totalValue: 0,
  averageOrderValue: 0,
  readyCount: 0,
  collectedCount: 0,
  paymentBreakdown: {}
};

export default function App() {
  const [selectedApp, setSelectedApp] = useState(null);
  const [authRole, setAuthRole] = useState(null);

  const [outletName, setOutletName] = useState("Vedic Chai - Koramangala");
  const [draftOutletName, setDraftOutletName] = useState("Vedic Chai - Koramangala");

  const [backendUrl, setBackendUrl] = useState("http://localhost:3000");
  const [draftBackendUrl, setDraftBackendUrl] = useState("http://localhost:3000");

  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [syncMessage, setSyncMessage] = useState("Initializing...");
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const apiBaseUrl = useMemo(() => normalizeBaseUrl(backendUrl), [backendUrl]);

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      try {
        const [savedOutlet, savedBackend] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.outletName),
          AsyncStorage.getItem(STORAGE_KEYS.backendUrl)
        ]);

        if (!mounted) return;

        if (savedOutlet) {
          setOutletName(savedOutlet);
          setDraftOutletName(savedOutlet);
        }
        if (savedBackend) {
          const normalized = normalizeBaseUrl(savedBackend);
          setBackendUrl(normalized);
          setDraftBackendUrl(normalized);
        }
      } catch {
        if (mounted) setSyncMessage("Could not load saved settings.");
      } finally {
        if (mounted) setSettingsLoaded(true);
      }
    }

    loadSettings();
    return () => {
      mounted = false;
    };
  }, []);

  async function fetchFromApi(path, options = {}) {
    const response = await fetch(`${apiBaseUrl}${path}`, options);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `Request failed (${response.status})`);
    }
    return data;
  }

  async function refreshMenu() {
    const data = await fetchFromApi("/api/menu");
    setMenu(Array.isArray(data.menu) ? data.menu : []);
  }

  async function refreshAdminData() {
    const data = await fetchFromApi("/api/admin/summary");
    setSummary(data.summary || EMPTY_SUMMARY);
    setOrders(Array.isArray(data.orders) ? data.orders : []);
  }

  useEffect(() => {
    if (!settingsLoaded) return;

    let isActive = true;

    async function load() {
      try {
        setSyncMessage("Syncing with backend...");
        await Promise.all([refreshMenu(), refreshAdminData()]);
        if (isActive) setSyncMessage(`Connected to ${apiBaseUrl}`);
      } catch (err) {
        if (isActive) setSyncMessage(`Backend error: ${err.message}`);
      }
    }

    load();
    const interval = setInterval(load, 5000);
    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [apiBaseUrl, settingsLoaded]);

  async function saveOutletName() {
    const nextName = draftOutletName.trim() || "Vedic Chai Outlet";
    setOutletName(nextName);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.outletName, nextName);
    } catch {
      setSyncMessage("Could not save outlet name.");
    }
  }

  async function saveBackendUrl() {
    const nextUrl = normalizeBaseUrl(draftBackendUrl) || "http://localhost:3000";
    setBackendUrl(nextUrl);
    setDraftBackendUrl(nextUrl);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.backendUrl, nextUrl);
    } catch {
      setSyncMessage("Could not save backend URL.");
    }
  }

  async function addPaidOrder(orderInput) {
    const data = await fetchFromApi("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderInput)
    });
    await refreshAdminData();
    return data.order;
  }

  async function verifyPickup(pickupCode) {
    const code = pickupCode.trim().toUpperCase();
    if (!code) return { ok: false, message: "Enter pickup code." };

    try {
      const data = await fetchFromApi("/api/verify-pickup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickupCode: code })
      });
      await refreshAdminData();
      return { ok: true, message: data.message || "Order verified and handed over." };
    } catch (err) {
      return { ok: false, message: err.message };
    }
  }

  function loginRole(role, username, pin) {
    const creds = DEMO_CREDENTIALS[role];
    const ok = creds && username.trim().toLowerCase() === creds.username && pin === creds.pin;
    if (ok) {
      setAuthRole(role);
      setSelectedApp(role);
      return { ok: true, message: `${role === "admin" ? "Admin" : "Outlet"} login successful.` };
    }
    return { ok: false, message: "Invalid credentials." };
  }

  function logoutRole() {
    setAuthRole(null);
    setSelectedApp(null);
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f3e5cf" />
      <ScrollView contentContainerStyle={styles.appScrollWrap}>
        <HeaderSettings
          outletName={outletName}
          draftOutletName={draftOutletName}
          setDraftOutletName={setDraftOutletName}
          saveOutletName={saveOutletName}
          draftBackendUrl={draftBackendUrl}
          setDraftBackendUrl={setDraftBackendUrl}
          saveBackendUrl={saveBackendUrl}
          syncMessage={syncMessage}
          authRole={authRole}
          onLogout={logoutRole}
        />

        {!selectedApp ? (
          <AppSelector onSelect={setSelectedApp} />
        ) : selectedApp === APP_TYPES.CUSTOMER ? (
          <CustomerApp menu={menu} onPay={addPaidOrder} outletName={outletName} averageValue={summary.averageOrderValue} />
        ) : selectedApp === APP_TYPES.OUTLET ? (
          <OutletApp
            orders={orders}
            onVerify={verifyPickup}
            menu={menu}
            isAuthorized={authRole === "outlet"}
            onLogin={(u, p) => loginRole("outlet", u, p)}
          />
        ) : (
          <AdminApp
            summary={summary}
            orders={orders}
            menu={menu}
            isAuthorized={authRole === "admin"}
            onLogin={(u, p) => loginRole("admin", u, p)}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function HeaderSettings({
  outletName,
  draftOutletName,
  setDraftOutletName,
  saveOutletName,
  draftBackendUrl,
  setDraftBackendUrl,
  saveBackendUrl,
  syncMessage,
  authRole,
  onLogout
}) {
  return (
    <View style={styles.heroCard}>
      <Text style={styles.heroLabel}>Vedic Chai Suite</Text>
      <Text style={styles.heroTitle}>{outletName}</Text>
      <Text style={styles.heroSub}>Customer app, outlet app, and admin dashboard</Text>

      <View style={styles.outletEditorRow}>
        <TextInput
          style={styles.outletInput}
          value={draftOutletName}
          onChangeText={setDraftOutletName}
          placeholder="Change outlet name"
          placeholderTextColor="#8b7460"
        />
        <TouchableOpacity style={styles.saveButton} onPress={saveOutletName}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.backendRow}>
        <TextInput
          style={styles.backendInput}
          value={draftBackendUrl}
          onChangeText={setDraftBackendUrl}
          placeholder="Backend URL (example: http://192.168.1.8:3000)"
          placeholderTextColor="#8b7460"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity style={styles.connectButton} onPress={saveBackendUrl}>
          <Text style={styles.connectButtonText}>Connect</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.authRow}>
        <Text style={styles.syncText}>{syncMessage}</Text>
        {authRole ? (
          <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
            <Text style={styles.logoutText}>Logout ({authRole})</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

function AppSelector({ onSelect }) {
  return (
    <Card title="Choose App" subtitle="Use each app independently">
      <TouchableOpacity style={styles.appTile} onPress={() => onSelect(APP_TYPES.CUSTOMER)}>
        <Text style={styles.appTileTitle}>Customer App</Text>
        <Text style={styles.appTileText}>Place prepaid orders and generate pickup QR/code.</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.appTile} onPress={() => onSelect(APP_TYPES.OUTLET)}>
        <Text style={styles.appTileTitle}>Outlet App</Text>
        <Text style={styles.appTileText}>Verify pickup codes and hand over orders.</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.appTile} onPress={() => onSelect(APP_TYPES.ADMIN)}>
        <Text style={styles.appTileTitle}>Admin Dashboard</Text>
        <Text style={styles.appTileText}>Track order metrics, revenue, and payment mix.</Text>
      </TouchableOpacity>
    </Card>
  );
}

function CustomerApp({ menu, onPay, outletName, averageValue }) {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("UPI");
  const [quantities, setQuantities] = useState({});
  const [message, setMessage] = useState({ type: "", text: "" });
  const [paidOrder, setPaidOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setQuantities((prev) => {
      const next = { ...prev };
      for (const item of menu) {
        if (next[item.id] === undefined) next[item.id] = "0";
      }
      return next;
    });
  }, [menu]);

  const selectedItems = useMemo(
    () =>
      menu
        .map((item) => ({ itemId: item.id, quantity: Number(quantities[item.id] || "0") }))
        .filter((line) => Number.isInteger(line.quantity) && line.quantity > 0),
    [menu, quantities]
  );

  const total = selectedItems.reduce((sum, line) => {
    const item = menu.find((entry) => entry.id === line.itemId);
    return sum + Number(item?.price || 0) * line.quantity;
  }, 0);

  async function onPayPress() {
    if (!customerName.trim() || !phone.trim() || selectedItems.length === 0) {
      setMessage({ type: "error", text: "Add customer details and select at least one item." });
      return;
    }

    setIsSubmitting(true);
    try {
      const order = await onPay({
        customerName: customerName.trim(),
        phone: phone.trim(),
        items: selectedItems,
        total: Number(total.toFixed(2)),
        paymentMethod: selectedPayment,
        paid: true
      });
      setPaidOrder(order);
      setMessage({ type: "success", text: `Payment successful via ${selectedPayment}. Order sent to ${outletName}.` });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Card title="Customer App" subtitle={`Avg. order value: ${formatInr(averageValue)}`}>
        <LabelText text="Name" />
        <TextInput style={styles.input} value={customerName} onChangeText={setCustomerName} placeholder="Enter full name" placeholderTextColor="#8a7b6f" />
        <LabelText text="Phone" />
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Enter phone number" placeholderTextColor="#8a7b6f" />
      </Card>

      <Card title="Build Your Order" subtitle={`Pickup from ${outletName}`}>
        {menu.length === 0 ? (
          <Text style={styles.helperText}>No menu loaded. Check backend connection.</Text>
        ) : (
          menu.map((item) => (
            <View key={item.id} style={styles.menuRow}>
              <View>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>{formatInr(item.price)}</Text>
              </View>
              <TextInput
                style={styles.qtyInput}
                keyboardType="number-pad"
                value={quantities[item.id] ?? "0"}
                onChangeText={(text) =>
                  setQuantities((prev) => ({
                    ...prev,
                    [item.id]: text.replace(/[^0-9]/g, "") || "0"
                  }))
                }
              />
            </View>
          ))
        )}
      </Card>

      <Card title="Payment" subtitle="Choose payment option">
        <View style={styles.paymentGrid}>
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method}
              style={[styles.paymentChip, selectedPayment === method && styles.paymentChipActive]}
              onPress={() => setSelectedPayment(method)}
            >
              <Text style={[styles.paymentChipText, selectedPayment === method && styles.paymentChipTextActive]}>{method}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatInr(total)}</Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={onPayPress} disabled={isSubmitting}>
          <Text style={styles.primaryButtonText}>{isSubmitting ? "Processing..." : "Pay and Place Order"}</Text>
        </TouchableOpacity>

        {!!message.text && <Text style={message.type === "error" ? styles.errorText : styles.successText}>{message.text}</Text>}
      </Card>

      {paidOrder ? (
        <Card title="Pickup Verification" subtitle={`Payment: ${paidOrder.paymentMethod}`}>
          <Text style={styles.helperText}>Show this pickup code.</Text>
          <Text style={styles.pickupCode}>{paidOrder.pickupCode}</Text>
        </Card>
      ) : null}
    </>
  );
}

function OutletApp({ orders, onVerify, menu, isAuthorized, onLogin }) {
  const [pickupCode, setPickupCode] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isVerifying, setIsVerifying] = useState(false);
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");

  const menuNameMap = useMemo(() => {
    const map = {};
    for (const item of menu) map[item.id] = item.name;
    return map;
  }, [menu]);

  function onLoginPress() {
    const result = onLogin(username, pin);
    setMessage({ type: result.ok ? "success" : "error", text: result.message });
    if (result.ok) {
      setUsername("");
      setPin("");
    }
  }

  async function onVerifyPress() {
    setIsVerifying(true);
    const result = await onVerify(pickupCode);
    setMessage({ type: result.ok ? "success" : "error", text: result.message });
    if (result.ok) setPickupCode("");
    setIsVerifying(false);
  }

  if (!isAuthorized) {
    return (
      <LoginCard
        title="Outlet App Login"
        subtitle="Only outlet users can access handover operations"
        username={username}
        setUsername={setUsername}
        pin={pin}
        setPin={setPin}
        onLoginPress={onLoginPress}
        message={message}
        hint="Demo: outlet / 1234"
      />
    );
  }

  return (
    <>
      <Card title="Outlet App" subtitle="Verify pickup codes and handover">
        <TextInput
          style={styles.input}
          value={pickupCode}
          onChangeText={setPickupCode}
          autoCapitalize="characters"
          placeholder="VC-123456"
          placeholderTextColor="#8a7b6f"
        />
        <TouchableOpacity style={styles.primaryButton} onPress={onVerifyPress} disabled={isVerifying}>
          <Text style={styles.primaryButtonText}>{isVerifying ? "Verifying..." : "Verify and Handover"}</Text>
        </TouchableOpacity>
        {!!message.text && <Text style={message.type === "error" ? styles.errorText : styles.successText}>{message.text}</Text>}
      </Card>

      <Card title="Pickup Queue" subtitle={`${orders.filter((o) => o.status === "READY_FOR_PICKUP").length} ready orders`}>
        {orders.length === 0 ? (
          <Text style={styles.helperText}>No paid orders yet.</Text>
        ) : (
          orders.map((order) => (
            <View key={order.id} style={styles.orderBox}>
              <View style={styles.orderTopRow}>
                <Text style={styles.orderHead}>{order.customerName}</Text>
                <Text style={styles.orderAmount}>{formatInr(order.total)}</Text>
              </View>
              <Text style={styles.helperText}>{order.phone}</Text>
              <Text style={styles.helperText}>{new Date(order.createdAt).toLocaleTimeString()} | {order.paymentMethod || "UPI"}</Text>
              <Text style={styles.helperText}>Pickup: {order.pickupCode}</Text>
              <Text style={styles.helperText}>Items: {order.items.map((line) => `${menuNameMap[line.itemId] || line.itemId} x${line.quantity}`).join(", ")}</Text>
              <View style={[styles.statusBadge, order.status === "COLLECTED" ? styles.statusCollected : styles.statusReady]}>
                <Text style={styles.statusText}>{order.status}</Text>
              </View>
            </View>
          ))
        )}
      </Card>
    </>
  );
}

function AdminApp({ summary, orders, menu, isAuthorized, onLogin }) {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  const menuNameMap = useMemo(() => {
    const map = {};
    for (const item of menu) map[item.id] = item.name;
    return map;
  }, [menu]);

  function onLoginPress() {
    const result = onLogin(username, pin);
    setMessage({ type: result.ok ? "success" : "error", text: result.message });
    if (result.ok) {
      setUsername("");
      setPin("");
    }
  }

  if (!isAuthorized) {
    return (
      <LoginCard
        title="Admin Dashboard Login"
        subtitle="Only admin can access business analytics"
        username={username}
        setUsername={setUsername}
        pin={pin}
        setPin={setPin}
        onLoginPress={onLoginPress}
        message={message}
        hint="Demo: admin / 4321"
      />
    );
  }

  return (
    <>
      <Card title="Admin Dashboard" subtitle="Business snapshot">
        <View style={styles.kpiGrid}>
          <KpiCard label="Total Orders" value={`${summary.totalOrders}`} />
          <KpiCard label="Total Value" value={formatInr(summary.totalValue)} />
          <KpiCard label="Avg Order" value={formatInr(summary.averageOrderValue)} />
          <KpiCard label="Collected" value={`${summary.collectedCount}`} />
        </View>
      </Card>

      <Card title="Payment Mix" subtitle="Order count by payment method">
        <View style={styles.paymentGrid}>
          {Object.entries(summary.paymentBreakdown || {}).map(([method, count]) => (
            <View key={method} style={styles.paymentChip}>
              <Text style={styles.paymentChipText}>{method}: {count}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card title="All Orders" subtitle={`${orders.length} total orders`}>
        {orders.length === 0 ? (
          <Text style={styles.helperText}>No orders yet.</Text>
        ) : (
          orders.map((order) => (
            <View key={order.id} style={styles.orderBox}>
              <View style={styles.orderTopRow}>
                <Text style={styles.orderHead}>{order.customerName}</Text>
                <Text style={styles.orderAmount}>{formatInr(order.total)}</Text>
              </View>
              <Text style={styles.helperText}>{order.phone}</Text>
              <Text style={styles.helperText}>{new Date(order.createdAt).toLocaleTimeString()} | {order.paymentMethod || "UPI"}</Text>
              <Text style={styles.helperText}>Items: {order.items.map((line) => `${menuNameMap[line.itemId] || line.itemId} x${line.quantity}`).join(", ")}</Text>
              <View style={[styles.statusBadge, order.status === "COLLECTED" ? styles.statusCollected : styles.statusReady]}>
                <Text style={styles.statusText}>{order.status}</Text>
              </View>
            </View>
          ))
        )}
      </Card>
    </>
  );
}

function LoginCard({ title, subtitle, username, setUsername, pin, setPin, onLoginPress, message, hint }) {
  return (
    <Card title={title} subtitle={subtitle}>
      <LabelText text="Username" />
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholder="Enter username"
        autoCapitalize="none"
        placeholderTextColor="#8a7b6f"
      />
      <LabelText text="PIN" />
      <TextInput
        style={styles.input}
        value={pin}
        onChangeText={setPin}
        placeholder="4-digit PIN"
        secureTextEntry
        keyboardType="number-pad"
        placeholderTextColor="#8a7b6f"
      />
      <TouchableOpacity style={styles.primaryButton} onPress={onLoginPress}>
        <Text style={styles.primaryButtonText}>Login</Text>
      </TouchableOpacity>
      {!!message.text && <Text style={message.type === "error" ? styles.errorText : styles.successText}>{message.text}</Text>}
      <Text style={styles.helperText}>{hint}</Text>
    </Card>
  );
}

function Card({ title, subtitle, children }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {!!subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
      {children}
    </View>
  );
}

function LabelText({ text }) {
  return <Text style={styles.label}>{text}</Text>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3e5cf"
  },
  appScrollWrap: {
    padding: 14,
    paddingBottom: 34
  },
  heroCard: {
    backgroundColor: "#fff9ee",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e4ceb1",
    padding: 14,
    marginBottom: 12
  },
  heroLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#7d6048",
    marginBottom: 4
  },
  heroTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: "#3f2817"
  },
  heroSub: {
    marginTop: 3,
    color: "#6f5039"
  },
  outletEditorRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12
  },
  outletInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccb295",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "#fff"
  },
  saveButton: {
    backgroundColor: "#2f855a",
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: "center"
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700"
  },
  backendRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8
  },
  backendInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccb295",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "#fff"
  },
  connectButton: {
    backgroundColor: "#1f6f9d",
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: "center"
  },
  connectButtonText: {
    color: "#fff",
    fontWeight: "700"
  },
  authRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8
  },
  syncText: {
    color: "#6a4c37",
    fontSize: 12,
    flex: 1
  },
  logoutButton: {
    backgroundColor: "#a1362a",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  logoutText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 11
  },
  card: {
    backgroundColor: "#fffaf2",
    borderWidth: 1,
    borderColor: "#e2ccb0",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#3f2817"
  },
  cardSubtitle: {
    color: "#6f5039",
    marginTop: 2,
    marginBottom: 10
  },
  appTile: {
    borderWidth: 1,
    borderColor: "#dfc6a7",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff"
  },
  appTileTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3f2817"
  },
  appTileText: {
    marginTop: 4,
    color: "#6f5039"
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  kpiCard: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4ceb1",
    borderRadius: 12,
    padding: 10
  },
  kpiLabel: {
    color: "#6f5039",
    fontSize: 12
  },
  kpiValue: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "800",
    color: "#3f2817"
  },
  label: {
    fontSize: 13,
    color: "#5e4634",
    marginBottom: 6,
    marginTop: 2
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccb295",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 12,
    color: "#2e1f14",
    backgroundColor: "#fff"
  },
  menuRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5d1bc",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    backgroundColor: "#fff"
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#352214"
  },
  itemPrice: {
    fontSize: 13,
    color: "#6f5039",
    marginTop: 2
  },
  qtyInput: {
    width: 56,
    borderWidth: 1,
    borderColor: "#c8af93",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    textAlign: "center",
    backgroundColor: "#fff"
  },
  paymentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12
  },
  paymentChip: {
    borderWidth: 1,
    borderColor: "#caa98a",
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: "#fff"
  },
  paymentChipActive: {
    backgroundColor: "#9e5a2a",
    borderColor: "#9e5a2a"
  },
  paymentChipText: {
    color: "#6a4a34",
    fontWeight: "600"
  },
  paymentChipTextActive: {
    color: "#fff"
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 4
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4a3120"
  },
  totalValue: {
    fontSize: 19,
    fontWeight: "800",
    color: "#1f5f3e"
  },
  primaryButton: {
    backgroundColor: "#9e5a2a",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center"
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15
  },
  errorText: {
    marginTop: 10,
    color: "#b42318",
    fontWeight: "600"
  },
  successText: {
    marginTop: 10,
    color: "#196c3c",
    fontWeight: "600"
  },
  helperText: {
    color: "#5f4634",
    fontSize: 13,
    marginTop: 8
  },
  pickupCode: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#3f2817"
  },
  orderBox: {
    borderWidth: 1,
    borderColor: "#e4cfb6",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#fff"
  },
  orderTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  orderHead: {
    fontSize: 15,
    fontWeight: "700",
    color: "#3c2718"
  },
  orderAmount: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1f5f3e"
  },
  statusBadge: {
    marginTop: 8,
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  statusReady: {
    backgroundColor: "#efe1cc"
  },
  statusCollected: {
    backgroundColor: "#d8efdf"
  },
  statusText: {
    fontWeight: "700",
    fontSize: 12,
    color: "#503825"
  }
});
