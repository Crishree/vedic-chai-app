import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = { backendUrl: "admin_backend_url", outletName: "admin_outlet_name" };
const CREDENTIALS = { username: "admin", pin: "4321" };

const inr = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatInr = (value) => `₹${inr.format(Number(value || 0))}`;
const normalizeBaseUrl = (url) => (url || "").trim().replace(/\/+$/, "");

const EMPTY_SUMMARY = {
  totalOrders: 0,
  totalValue: 0,
  averageOrderValue: 0,
  readyCount: 0,
  collectedCount: 0,
  paymentBreakdown: {}
};
const EMPTY_PAYMENT_CONFIG = {
  customerAppName: "Vedic Chai Grab And Go",
  upiId: "",
  payeeName: "",
  bankName: "",
  accountNumber: "",
  ifsc: "",
  enabledPaymentMethods: ["GPay", "PhonePe", "Paytm", "UPI", "Card", "Cash"]
};
const DEFAULT_AVAILABLE_METHODS = ["GPay", "PhonePe", "Paytm", "UPI", "Card", "Cash"];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");

  const [outletName, setOutletName] = useState("Vedic Chai - Koramangala");
  const [draftOutletName, setDraftOutletName] = useState("Vedic Chai - Koramangala");
  const [backendUrl, setBackendUrl] = useState("http://localhost:3000");
  const [draftBackendUrl, setDraftBackendUrl] = useState("http://localhost:3000");

  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [orders, setOrders] = useState([]);
  const [paymentConfig, setPaymentConfig] = useState(EMPTY_PAYMENT_CONFIG);
  const [draftPaymentConfig, setDraftPaymentConfig] = useState(EMPTY_PAYMENT_CONFIG);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState(DEFAULT_AVAILABLE_METHODS);
  const [status, setStatus] = useState("Initializing...");
  const [message, setMessage] = useState({ type: "", text: "" });

  const apiBaseUrl = useMemo(() => normalizeBaseUrl(backendUrl), [backendUrl]);

  useEffect(() => {
    let mounted = true;
    async function loadSettings() {
      const [savedBackend, savedOutlet] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.backendUrl),
        AsyncStorage.getItem(STORAGE_KEYS.outletName)
      ]);
      if (!mounted) return;
      if (savedBackend) {
        const normalized = normalizeBaseUrl(savedBackend);
        setBackendUrl(normalized);
        setDraftBackendUrl(normalized);
      }
      if (savedOutlet) {
        setOutletName(savedOutlet);
        setDraftOutletName(savedOutlet);
      }
    }
    loadSettings().catch(() => setStatus("Could not load saved settings."));
    return () => {
      mounted = false;
    };
  }, []);

  async function fetchFromApi(path, options = {}) {
    const response = await fetch(`${apiBaseUrl}${path}`, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
    return data;
  }

  async function refreshAdmin() {
    try {
      setStatus("Syncing dashboard...");
      const data = await fetchFromApi("/api/admin/summary");
      setSummary(data.summary || EMPTY_SUMMARY);
      setOrders(Array.isArray(data.orders) ? data.orders : []);
      setAvailablePaymentMethods(Array.isArray(data.availablePaymentMethods) && data.availablePaymentMethods.length ? data.availablePaymentMethods : DEFAULT_AVAILABLE_METHODS);
      const cfg = data.paymentConfig || EMPTY_PAYMENT_CONFIG;
      setPaymentConfig(cfg);
      setDraftPaymentConfig(cfg);
      setStatus(`Connected to ${apiBaseUrl}`);
    } catch (err) {
      setStatus(`Backend error: ${err.message}`);
    }
  }

  useEffect(() => {
    refreshAdmin();
    const timer = setInterval(refreshAdmin, 5000);
    return () => clearInterval(timer);
  }, [apiBaseUrl]);

  function login() {
    const ok = username.trim().toLowerCase() === CREDENTIALS.username && pin === CREDENTIALS.pin;
    if (ok) {
      setIsAuthenticated(true);
      setMessage({ type: "success", text: "Admin login successful." });
      setUsername("");
      setPin("");
    } else {
      setMessage({ type: "error", text: "Invalid admin credentials." });
    }
  }

  async function saveSettings() {
    const nextOutlet = draftOutletName.trim() || "Vedic Chai Outlet";
    const nextBackend = normalizeBaseUrl(draftBackendUrl) || "http://localhost:3000";
    setOutletName(nextOutlet);
    setBackendUrl(nextBackend);
    setDraftBackendUrl(nextBackend);
    await AsyncStorage.setItem(STORAGE_KEYS.outletName, nextOutlet);
    await AsyncStorage.setItem(STORAGE_KEYS.backendUrl, nextBackend);
  }

  async function savePaymentConfig() {
    try {
      const data = await fetchFromApi("/api/admin/payment-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerAppName: draftPaymentConfig.customerAppName,
          upiId: draftPaymentConfig.upiId,
          payeeName: draftPaymentConfig.payeeName,
          bankName: draftPaymentConfig.bankName,
          accountNumber: draftPaymentConfig.accountNumber,
          ifsc: draftPaymentConfig.ifsc,
          enabledPaymentMethods: draftPaymentConfig.enabledPaymentMethods || []
        })
      });
      const cfg = data.paymentConfig || EMPTY_PAYMENT_CONFIG;
      setPaymentConfig(cfg);
      setDraftPaymentConfig(cfg);
      setMessage({ type: "success", text: "Payment details saved." });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f3e5cf" />
      <ScrollView contentContainerStyle={styles.wrap}>
        <Card title="Admin Dashboard" subtitle={outletName}>
          <TextInput style={styles.input} value={draftOutletName} onChangeText={setDraftOutletName} placeholder="Outlet name" placeholderTextColor="#8b7460" />
          <TextInput
            style={styles.input}
            value={draftBackendUrl}
            onChangeText={setDraftBackendUrl}
            placeholder="Backend URL"
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor="#8b7460"
          />
          <TouchableOpacity style={styles.secondaryButton} onPress={saveSettings}>
            <Text style={styles.secondaryButtonText}>Save Settings</Text>
          </TouchableOpacity>
          <Text style={styles.statusText}>{status}</Text>
        </Card>

        {!isAuthenticated ? (
          <Card title="Admin Login" subtitle="Restricted analytics access">
            <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="Username" autoCapitalize="none" placeholderTextColor="#8b7460" />
            <TextInput style={styles.input} value={pin} onChangeText={setPin} placeholder="PIN" secureTextEntry keyboardType="number-pad" placeholderTextColor="#8b7460" />
            <TouchableOpacity style={styles.primaryButton} onPress={login}>
              <Text style={styles.primaryButtonText}>Login</Text>
            </TouchableOpacity>
            <Text style={styles.helperText}>Demo: admin / 4321</Text>
            {!!message.text && <Text style={message.type === "error" ? styles.errorText : styles.successText}>{message.text}</Text>}
          </Card>
        ) : (
          <>
            <Card title="Metrics" subtitle="Live business snapshot">
              <View style={styles.kpiGrid}>
                <Kpi label="Orders" value={`${summary.totalOrders}`} />
                <Kpi label="Total Value" value={formatInr(summary.totalValue)} />
                <Kpi label="Avg Order" value={formatInr(summary.averageOrderValue)} />
                <Kpi label="Collected" value={`${summary.collectedCount}`} />
              </View>
            </Card>

            <Card title="Payment Mix" subtitle="Order count by method">
              <View style={styles.paymentGrid}>
                {Object.entries(summary.paymentBreakdown || {}).map(([method, count]) => (
                  <View key={method} style={styles.paymentChip}>
                    <Text style={styles.paymentChipText}>{method}: {count}</Text>
                  </View>
                ))}
              </View>
            </Card>

            <Card title="UPI & Banking Details" subtitle="Used by customer app for wallet payment destination">
              <TextInput
                style={styles.input}
                value={draftPaymentConfig.customerAppName}
                onChangeText={(text) => setDraftPaymentConfig((prev) => ({ ...prev, customerAppName: text }))}
                placeholder="Customer App Name"
                placeholderTextColor="#8b7460"
              />
              <TextInput
                style={styles.input}
                value={draftPaymentConfig.upiId}
                onChangeText={(text) => setDraftPaymentConfig((prev) => ({ ...prev, upiId: text }))}
                placeholder="UPI ID"
                autoCapitalize="none"
                placeholderTextColor="#8b7460"
              />
              <TextInput
                style={styles.input}
                value={draftPaymentConfig.payeeName}
                onChangeText={(text) => setDraftPaymentConfig((prev) => ({ ...prev, payeeName: text }))}
                placeholder="Payee Name"
                placeholderTextColor="#8b7460"
              />
              <TextInput
                style={styles.input}
                value={draftPaymentConfig.bankName}
                onChangeText={(text) => setDraftPaymentConfig((prev) => ({ ...prev, bankName: text }))}
                placeholder="Bank Name"
                placeholderTextColor="#8b7460"
              />
              <TextInput
                style={styles.input}
                value={draftPaymentConfig.accountNumber}
                onChangeText={(text) => setDraftPaymentConfig((prev) => ({ ...prev, accountNumber: text }))}
                placeholder="Account Number"
                placeholderTextColor="#8b7460"
              />
              <TextInput
                style={styles.input}
                value={draftPaymentConfig.ifsc}
                onChangeText={(text) => setDraftPaymentConfig((prev) => ({ ...prev, ifsc: text.toUpperCase() }))}
                placeholder="IFSC"
                autoCapitalize="characters"
                placeholderTextColor="#8b7460"
              />
              <Text style={styles.helperText}>Enabled Payment Options</Text>
              <View style={styles.paymentGrid}>
                {availablePaymentMethods.map((method) => {
                  const selected = (draftPaymentConfig.enabledPaymentMethods || []).includes(method);
                  return (
                    <TouchableOpacity
                      key={method}
                      style={[styles.paymentSelectChip, selected && styles.paymentSelectChipActive]}
                      onPress={() =>
                        setDraftPaymentConfig((prev) => {
                          const current = Array.isArray(prev.enabledPaymentMethods) ? prev.enabledPaymentMethods : [];
                          const next = current.includes(method) ? current.filter((item) => item !== method) : [...current, method];
                          return { ...prev, enabledPaymentMethods: next };
                        })
                      }
                    >
                      <Text style={[styles.paymentSelectChipText, selected && styles.paymentSelectChipTextActive]}>
                        {selected ? "✓ " : ""}{method}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity style={styles.primaryButton} onPress={savePaymentConfig}>
                <Text style={styles.primaryButtonText}>Save Payment Details</Text>
              </TouchableOpacity>
              <Text style={styles.helperText}>
                Current App Name: {paymentConfig.customerAppName || "Not set"}
              </Text>
              <Text style={styles.helperText}>
                Current UPI: {paymentConfig.upiId || "Not set"} | {paymentConfig.payeeName || "Not set"}
              </Text>
              <Text style={styles.helperText}>
                Enabled Methods: {(paymentConfig.enabledPaymentMethods || []).join(", ") || "None"}
              </Text>
            </Card>

            <Card title="Orders" subtitle={`${orders.length} total`}>
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
                    <Text style={styles.helperText}>Status: {order.status}</Text>
                  </View>
                ))
              )}
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Kpi({ label, value }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
    </View>
  );
}

function Card({ title, subtitle, children }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3e5cf" },
  wrap: { padding: 14, paddingBottom: 30 },
  card: { backgroundColor: "#fff9ee", borderWidth: 1, borderColor: "#e3cdb0", borderRadius: 14, padding: 14, marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#3f2817" },
  cardSubtitle: { color: "#6f5039", marginTop: 3, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#ccb295", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: "#fff", marginBottom: 10 },
  statusText: { color: "#6a4c37", fontSize: 12 },
  primaryButton: { backgroundColor: "#9e5a2a", borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  primaryButtonText: { color: "#fff", fontWeight: "700" },
  secondaryButton: { backgroundColor: "#1f6f9d", borderRadius: 10, paddingVertical: 10, alignItems: "center", marginBottom: 8 },
  secondaryButtonText: { color: "#fff", fontWeight: "700" },
  helperText: { color: "#6f5039", marginTop: 6 },
  errorText: { color: "#b42318", marginTop: 8, fontWeight: "600" },
  successText: { color: "#196c3c", marginTop: 8, fontWeight: "600" },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  kpiCard: { width: "48%", borderWidth: 1, borderColor: "#e4cfb6", borderRadius: 10, padding: 10, backgroundColor: "#fff" },
  kpiLabel: { color: "#6f5039", fontSize: 12 },
  kpiValue: { color: "#3f2817", fontWeight: "800", fontSize: 17, marginTop: 4 },
  paymentGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  paymentChip: { borderWidth: 1, borderColor: "#caa98a", borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: "#fff" },
  paymentChipText: { color: "#6a4a34", fontWeight: "600" },
  paymentSelectChip: { borderWidth: 1, borderColor: "#caa98a", borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12, backgroundColor: "#fff" },
  paymentSelectChipActive: { borderColor: "#9e5a2a", backgroundColor: "#f6e4d2" },
  paymentSelectChipText: { color: "#6a4a34", fontWeight: "600" },
  paymentSelectChipTextActive: { color: "#5b3215", fontWeight: "800" },
  orderBox: { borderWidth: 1, borderColor: "#e4cfb6", borderRadius: 10, padding: 10, marginBottom: 10, backgroundColor: "#fff" },
  orderTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderHead: { fontSize: 15, fontWeight: "700", color: "#3c2718" },
  orderAmount: { fontSize: 15, fontWeight: "700", color: "#1f5f3e" }
});
