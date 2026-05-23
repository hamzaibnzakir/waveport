import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Wallet, Plus, ArrowDownLeft, ArrowUpRight,
  RefreshCw, AlertCircle, CreditCard
} from "lucide-react";
import {
  collection, query, where, orderBy,
  limit, onSnapshot, doc, getDoc
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { FLUTTERWAVE_PUBLIC_KEY } from "../lib/flutterwave";
import { format } from "date-fns";
import "./Wallet.css";

// Flutterwave inline JS SDK
function loadFlutterwaveScript() {
  return new Promise((resolve) => {
    if (window.FlutterwaveCheckout) { resolve(); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.flutterwave.com/v3.js";
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

export default function WalletPage() {
  const { user, userProfile, refreshProfile } = useAuth();
  const [amount, setAmount] = useState("");
  const [txLoading, setTxLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [amountError, setAmountError] = useState("");

  const balance = typeof userProfile?.balance === "number"
    ? userProfile.balance.toFixed(2)
    : "0.00";

  // Real-time transaction history
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "transactions"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(30)
    );
    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user]);

  function validateAmount() {
    const val = parseFloat(amount);
    if (!amount || isNaN(val)) { setAmountError("Enter a valid amount"); return false; }
    if (val < 1) { setAmountError("Minimum top-up is $1"); return false; }
    if (val > 10000) { setAmountError("Maximum top-up is $10,000"); return false; }
    setAmountError("");
    return true;
  }

  async function handleAddFunds() {
    if (!validateAmount()) return;
    await loadFlutterwaveScript();
    setPaying(true);

    const val = parseFloat(amount);

    // ─────────────────────────────────────────────────────────────────
    // Flutterwave will automatically show the user's local currency
    // based on their location and IP. The amount is treated in USD
    // and converted by Flutterwave.
    // The "tx_ref" is a unique reference you should verify on your
    // VPS backend webhook endpoint after payment completes.
    // ─────────────────────────────────────────────────────────────────
    window.FlutterwaveCheckout({
      public_key: FLUTTERWAVE_PUBLIC_KEY,
      tx_ref: `fw_${user.uid}_${Date.now()}`,
      amount: val,
      currency: "USD", // Flutterwave handles local currency display
      customer: {
        email: user.email,
        name: userProfile?.name || user.email,
      },
      customizations: {
        title: "FlowBoost Wallet Top-Up",
        description: `Add $${val.toFixed(2)} to your wallet`,
        logo: "https://your-logo-url.com/logo.png", // Replace with your actual logo URL
      },
      callback: async (response) => {
        // ─────────────────────────────────────────────────────────────
        // IMPORTANT: After successful payment, your VPS backend webhook
        // handles the actual balance update in Firestore.
        //
        // Your VPS backend should:
        //  1. Receive Flutterwave webhook POST at /webhook/flutterwave
        //  2. Verify the payment using your secret key
        //  3. Update users/{uid}.balance in Firestore
        //  4. Write a record to transactions/{txId}
        //
        // The response.status here is client-side only — always
        // verify on the backend before crediting balance.
        // ─────────────────────────────────────────────────────────────

        if (response.status === "successful" || response.status === "completed") {
          // Poll for balance update (webhook updates Firestore within ~5s)
          setTxLoading(true);
          let attempts = 0;
          const poll = setInterval(async () => {
            await refreshProfile();
            attempts++;
            if (attempts >= 10) {
              clearInterval(poll);
              setTxLoading(false);
            }
          }, 2000);

          setAmount("");
          setPaying(false);
        } else {
          setPaying(false);
        }
      },
      onclose: () => { setPaying(false); },
    });
  }

  return (
    <div className="page-body">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1>Wallet</h1>
        <p>Manage your balance and view transaction history.</p>
      </motion.div>

      <div className="wallet-grid">
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Balance card */}
          <motion.div
            className="wallet-balance-card card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            <div className="wallet-balance-glow" />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div className="wallet-balance-icon">
                <Wallet size={20} />
              </div>
              <p className="balance-label" style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>
                Current Balance
              </p>
              <p className="wallet-balance-amount">${balance}</p>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.82rem", marginTop: 4 }}>
                Deducted automatically when campaigns run
              </p>

              {/* Low balance warning */}
              {parseFloat(balance) < 5 && parseFloat(balance) >= 0 && (
                <div className="wallet-low-warning">
                  <AlertCircle size={14} />
                  Balance low — active campaigns may pause soon
                </div>
              )}
            </div>
          </motion.div>

          {/* Add funds card */}
          <motion.div
            className="card"
            style={{ padding: 28 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 style={{ marginBottom: 6, fontSize: "1rem" }}>Add Funds</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.84rem", marginBottom: 20 }}>
              Enter how much you want to add. Payment is processed via Flutterwave
              and supports your local currency.
            </p>

            <div className="input-group" style={{ marginBottom: 16 }}>
              <label>Amount (USD)</label>
              <div className="amount-input-wrap">
                <span className="amount-prefix">$</span>
                <input
                  className={`input amount-input ${amountError ? "error" : ""}`}
                  type="number"
                  min="1"
                  max="10000"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (amountError) setAmountError("");
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddFunds(); }}
                />
              </div>
              {amountError && (
                <span className="input-error">{amountError}</span>
              )}
            </div>

            <button
              className="btn btn-primary btn-full btn-lg"
              onClick={handleAddFunds}
              disabled={paying || !amount}
            >
              {paying ? (
                <><div className="spinner" style={{ width: 18, height: 18, borderTopColor: "white" }} /> Opening checkout...</>
              ) : (
                <><CreditCard size={18} /> Pay with Flutterwave</>
              )}
            </button>

            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", marginTop: 12 }}>
              🔒 Secured by Flutterwave · Supports cards, bank transfers & mobile money
            </p>
          </motion.div>
        </div>

        {/* Right column — transaction history */}
        <motion.div
          className="section-block"
          style={{ height: "fit-content" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className="section-header">
            <h2>Transaction History</h2>
            {txLoading && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "var(--text-muted)" }}>
                <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} />
                Syncing...
              </div>
            )}
          </div>

          {transactions.length === 0 ? (
            <div className="empty-state" style={{ padding: "48px 20px" }}>
              <Wallet size={32} style={{ color: "var(--border-mid)", marginBottom: 12 }} />
              <p>No transactions yet.</p>
              <p style={{ fontSize: "0.82rem", marginTop: 4 }}>
                Add funds to get started.
              </p>
            </div>
          ) : (
            <div className="tx-list">
              {transactions.map((tx) => {
                const isCredit = tx.type === "topup";
                const date = tx.createdAt?.toDate?.() || new Date();
                return (
                  <div key={tx.id} className="tx-item">
                    <div className={`tx-icon ${isCredit ? "tx-icon--credit" : "tx-icon--debit"}`}>
                      {isCredit
                        ? <ArrowDownLeft size={16} />
                        : <ArrowUpRight size={16} />
                      }
                    </div>
                    <div className="tx-info">
                      <p className="tx-desc">
                        {isCredit ? "Wallet Top-Up" : `Campaign: ${tx.campaignName || "Deduction"}`}
                      </p>
                      <p className="tx-date">{format(date, "MMM d, yyyy · h:mm a")}</p>
                    </div>
                    <div className="tx-amount-wrap">
                      <p className={`tx-amount ${isCredit ? "tx-amount--credit" : "tx-amount--debit"}`}>
                        {isCredit ? "+" : "-"}${Math.abs(tx.amount).toFixed(2)}
                      </p>
                      <p className="tx-balance-after">
                        Balance: ${(tx.balanceAfter || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
