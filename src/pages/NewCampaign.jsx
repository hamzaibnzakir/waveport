import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket, ChevronRight, ChevronLeft, Check,
  AlertTriangle, Globe, Clock, Zap
} from "lucide-react";
import {
  collection, addDoc, doc, updateDoc,
  increment, serverTimestamp
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import "./NewCampaign.css";

const PLATFORMS = [
  { id: "facebook", label: "Facebook", color: "#1877F2", icon: "f" },
  { id: "instagram", label: "Instagram", color: "#E1306C", icon: "in" },
  { id: "tiktok", label: "TikTok", color: "#010101", icon: "tt" },
  { id: "twitter", label: "Twitter / X", color: "#1DA1F2", icon: "x" },
  { id: "youtube", label: "YouTube", color: "#FF0000", icon: "yt" },
  { id: "reddit", label: "Reddit", color: "#FF4500", icon: "r" },
  { id: "google", label: "Google", color: "#4285F4", icon: "g" },
];

const TRAFFIC_TYPES = [
  {
    id: "facebook_simulated",
    label: "Facebook Simulated",
    desc: "Traffic appears to originate from Facebook referrals",
    icon: Globe,
    color: "#1877F2",
  },
  {
    id: "platform",
    label: "Platform Traffic",
    desc: "Choose any social media platform as the traffic source",
    icon: Zap,
    color: "var(--blue-brand)",
  },
];

const DELIVERY_TYPES = [
  {
    id: "burst_24hr",
    label: "24-Hour Burst",
    desc: "All traffic delivered within 24 hours. Deducted from balance daily — pauses if balance runs out.",
    icon: Clock,
    color: "var(--accent-amber)",
  },
  {
    id: "scheduled",
    label: "Scheduled Delivery",
    desc: "Spread traffic evenly over a chosen period.",
    icon: Rocket,
    color: "var(--blue-brand)",
  },
];

const DURATIONS = [3, 7, 14, 30];

// Cost calculation (adjust rates as you see fit)
const RATE_PER_1K = 0.80; // $0.80 per 1000 visitors

function calcCost(volume, deliveryType, duration) {
  const base = (volume / 1000) * RATE_PER_1K;
  if (deliveryType === "burst_24hr") return base;
  const multiplier = { 3: 1.0, 7: 0.95, 14: 0.9, 30: 0.85 }[duration] || 1.0;
  return base * multiplier;
}

const STEPS = ["Campaign Setup", "Delivery Settings", "Review & Launch"];

export default function NewCampaign() {
  const { user, userProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [launching, setLaunching] = useState(false);

  const [form, setForm] = useState({
    name: "",
    url: "",
    trafficType: "",
    platform: "",
    volume: 5000,
    customVolume: "",
    deliveryType: "",
    duration: 7,
  });
  const [errors, setErrors] = useState({});

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  }

  const volume = form.volume === "custom"
    ? parseInt(form.customVolume) || 0
    : form.volume;

  const cost = form.deliveryType
    ? calcCost(volume, form.deliveryType, form.duration)
    : 0;

  const balance = userProfile?.balance || 0;
  const costPerDay = form.deliveryType === "burst_24hr"
    ? cost
    : cost / form.duration;

  // Step validators
  function validateStep(s) {
    const errs = {};
    if (s === 0) {
      if (!form.name.trim()) errs.name = "Campaign name is required";
      if (!form.url.trim()) errs.url = "Target URL is required";
      else if (!/^https?:\/\/.+/.test(form.url)) errs.url = "URL must start with http:// or https://";
      if (!form.trafficType) errs.trafficType = "Select a traffic type";
      if (form.trafficType === "platform" && !form.platform) errs.platform = "Select a platform";
    }
    if (s === 1) {
      if (!form.deliveryType) errs.deliveryType = "Select a delivery type";
      if (form.volume === "custom" && (!form.customVolume || parseInt(form.customVolume) < 100))
        errs.customVolume = "Minimum 100 visitors";
    }
    return errs;
  }

  function nextStep() {
    const errs = validateStep(step);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStep((s) => s + 1);
  }

  async function launch() {
    if (balance < cost) {
      toast.error("Insufficient balance. Please top up your wallet.");
      return;
    }

    setLaunching(true);
    try {
      const campaignData = {
        uid: user.uid,
        name: form.name.trim(),
        url: form.url.trim(),
        trafficType: form.trafficType,
        platform: form.trafficType === "facebook_simulated"
          ? "facebook"
          : form.platform,
        volume,
        deliveryType: form.deliveryType,
        duration: form.deliveryType === "burst_24hr" ? 1 : form.duration,
        costTotal: parseFloat(cost.toFixed(2)),
        costPerDay: parseFloat(costPerDay.toFixed(2)),
        deliveredCount: 0,
        status: "active",
        createdAt: serverTimestamp(),
        startDate: serverTimestamp(),
      };

      await addDoc(collection(db, "campaigns"), campaignData);

      // Deduct initial cost from balance
      // Full deduction for scheduled; first day for burst (backend handles daily)
      const deductAmount = form.deliveryType === "burst_24hr" ? costPerDay : cost;
      await updateDoc(doc(db, "users", user.uid), {
        balance: increment(-deductAmount),
      });

      await refreshProfile();
      toast.success("Campaign launched! 🚀");
      navigate("/campaigns");
    } catch (err) {
      console.error(err);
      toast.error("Failed to launch campaign. Please try again.");
    } finally {
      setLaunching(false);
    }
  }

  return (
    <div className="page-body">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1>New Campaign</h1>
        <p>Set up your traffic campaign in minutes.</p>
      </motion.div>

      {/* Stepper */}
      <div className="stepper">
        {STEPS.map((label, i) => (
          <div key={label} className={`step-item ${i <= step ? "step-item--done" : ""} ${i === step ? "step-item--active" : ""}`}>
            <div className="step-circle">
              {i < step ? <Check size={14} /> : <span>{i + 1}</span>}
            </div>
            <span className="step-label">{label}</span>
            {i < STEPS.length - 1 && <div className="step-line" />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="card wizard-card"
        >
          {/* ── STEP 0: Campaign Basics ── */}
          {step === 0 && (
            <div>
              <h2 className="wizard-title">Campaign Basics</h2>
              <p className="wizard-sub">Tell us where and how to send your traffic.</p>

              <div className="wizard-fields">
                <div className="input-group">
                  <label>Campaign Name</label>
                  <input
                    className={`input ${errors.name ? "error" : ""}`}
                    placeholder="e.g. Blog Launch Push"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                  />
                  {errors.name && <span className="input-error">{errors.name}</span>}
                </div>

                <div className="input-group">
                  <label>Target Website URL</label>
                  <input
                    className={`input ${errors.url ? "error" : ""}`}
                    placeholder="https://yourwebsite.com"
                    value={form.url}
                    onChange={(e) => set("url", e.target.value)}
                  />
                  {errors.url && <span className="input-error">{errors.url}</span>}
                </div>

                <div className="input-group">
                  <label>Traffic Type</label>
                  <div className="option-cards">
                    {TRAFFIC_TYPES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className={`option-card ${form.trafficType === t.id ? "option-card--selected" : ""}`}
                        onClick={() => set("trafficType", t.id)}
                        style={{ "--card-color": t.color }}
                      >
                        <t.icon size={22} style={{ color: t.color }} />
                        <div>
                          <p className="option-card-title">{t.label}</p>
                          <p className="option-card-desc">{t.desc}</p>
                        </div>
                        <div className="option-card-check">
                          {form.trafficType === t.id && <Check size={14} />}
                        </div>
                      </button>
                    ))}
                  </div>
                  {errors.trafficType && <span className="input-error">{errors.trafficType}</span>}
                </div>

                {/* Platform selector — only for "platform" type */}
                {form.trafficType === "platform" && (
                  <motion.div
                    className="input-group"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.25 }}
                  >
                    <label>Source Platform</label>
                    <div className="platform-grid">
                      {PLATFORMS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className={`platform-btn ${form.platform === p.id ? "platform-btn--selected" : ""}`}
                          onClick={() => set("platform", p.id)}
                          style={{ "--p-color": p.color }}
                        >
                          <span className="platform-icon" style={{ background: p.color }}>{p.icon}</span>
                          <span>{p.label}</span>
                        </button>
                      ))}
                    </div>
                    {errors.platform && <span className="input-error">{errors.platform}</span>}
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 1: Delivery Settings ── */}
          {step === 1 && (
            <div>
              <h2 className="wizard-title">Delivery Settings</h2>
              <p className="wizard-sub">Choose how much traffic and how fast to deliver it.</p>

              <div className="wizard-fields">
                {/* Volume */}
                <div className="input-group">
                  <label>Traffic Volume</label>
                  <div className="volume-grid">
                    {[1000, 5000, 10000, 25000, "custom"].map((v) => (
                      <button
                        key={v}
                        type="button"
                        className={`volume-btn ${form.volume === v ? "volume-btn--selected" : ""}`}
                        onClick={() => set("volume", v)}
                      >
                        {v === "custom" ? "Custom" : v.toLocaleString()}
                        {v !== "custom" && <span className="volume-unit">visitors</span>}
                      </button>
                    ))}
                  </div>

                  {form.volume === "custom" && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{ marginTop: 12 }}
                    >
                      <input
                        className={`input ${errors.customVolume ? "error" : ""}`}
                        type="number"
                        min="100"
                        placeholder="Enter number of visitors (min 100)"
                        value={form.customVolume}
                        onChange={(e) => set("customVolume", e.target.value)}
                      />
                      {errors.customVolume && (
                        <span className="input-error">{errors.customVolume}</span>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Delivery type */}
                <div className="input-group">
                  <label>Delivery Type</label>
                  <div className="option-cards">
                    {DELIVERY_TYPES.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        className={`option-card ${form.deliveryType === d.id ? "option-card--selected" : ""}`}
                        onClick={() => set("deliveryType", d.id)}
                        style={{ "--card-color": d.color }}
                      >
                        <d.icon size={22} style={{ color: d.color }} />
                        <div>
                          <p className="option-card-title">{d.label}</p>
                          <p className="option-card-desc">{d.desc}</p>
                        </div>
                        <div className="option-card-check">
                          {form.deliveryType === d.id && <Check size={14} />}
                        </div>
                      </button>
                    ))}
                  </div>
                  {errors.deliveryType && <span className="input-error">{errors.deliveryType}</span>}
                </div>

                {/* Duration — only for scheduled */}
                {form.deliveryType === "scheduled" && (
                  <motion.div
                    className="input-group"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.25 }}
                  >
                    <label>Duration</label>
                    <div className="duration-grid">
                      {DURATIONS.map((d) => (
                        <button
                          key={d}
                          type="button"
                          className={`duration-btn ${form.duration === d ? "duration-btn--selected" : ""}`}
                          onClick={() => set("duration", d)}
                        >
                          {d} days
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Live cost preview */}
                {form.deliveryType && volume > 0 && (
                  <motion.div
                    className="cost-preview"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="cost-preview-row">
                      <span>Estimated Cost</span>
                      <span className="cost-preview-val">${cost.toFixed(2)}</span>
                    </div>
                    {form.deliveryType === "scheduled" && (
                      <div className="cost-preview-row">
                        <span>Per Day</span>
                        <span>${costPerDay.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="cost-preview-row">
                      <span>Your Balance</span>
                      <span style={{ color: balance >= cost ? "#00a06b" : "var(--red)", fontWeight: 600 }}>
                        ${balance.toFixed(2)}
                        {balance < cost && " (insufficient)"}
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 2: Review ── */}
          {step === 2 && (
            <div>
              <h2 className="wizard-title">Review & Launch</h2>
              <p className="wizard-sub">Confirm your campaign details before going live.</p>

              <div className="review-grid">
                <ReviewRow label="Campaign Name" value={form.name} />
                <ReviewRow label="Target URL" value={form.url} />
                <ReviewRow
                  label="Traffic Type"
                  value={TRAFFIC_TYPES.find((t) => t.id === form.trafficType)?.label}
                />
                {form.trafficType === "platform" && (
                  <ReviewRow
                    label="Platform"
                    value={PLATFORMS.find((p) => p.id === form.platform)?.label}
                  />
                )}
                <ReviewRow label="Volume" value={`${volume.toLocaleString()} visitors`} />
                <ReviewRow
                  label="Delivery"
                  value={form.deliveryType === "burst_24hr"
                    ? "24-Hour Burst"
                    : `Scheduled — ${form.duration} days`
                  }
                />
                <div className="divider" />
                <ReviewRow label="Total Cost" value={`$${cost.toFixed(2)}`} bold />
                <ReviewRow label="Your Balance" value={`$${balance.toFixed(2)}`} />
                <ReviewRow
                  label="Balance After"
                  value={`$${Math.max(0, balance - cost).toFixed(2)}`}
                  highlight={balance >= cost ? "green" : "red"}
                />
              </div>

              {balance < cost && (
                <div className="review-warning">
                  <AlertTriangle size={16} />
                  <span>
                    Your balance is insufficient. Please{" "}
                    <button
                      style={{ color: "var(--accent-amber)", fontWeight: 700, textDecoration: "underline" }}
                      onClick={() => navigate("/wallet")}
                    >
                      add funds
                    </button>{" "}
                    before launching.
                  </span>
                </div>
              )}

              {form.deliveryType === "burst_24hr" && (
                <div className="review-info">
                  <Zap size={14} />
                  <span>
                    24hr burst campaigns deduct daily. If balance hits $0, the campaign pauses automatically
                    and resumes when you top up.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="wizard-nav">
            {step > 0 && (
              <button
                className="btn btn-ghost btn-lg"
                onClick={() => setStep((s) => s - 1)}
                disabled={launching}
              >
                <ChevronLeft size={18} /> Back
              </button>
            )}
            <div style={{ flex: 1 }} />
            {step < 2 ? (
              <button className="btn btn-primary btn-lg" onClick={nextStep}>
                Continue <ChevronRight size={18} />
              </button>
            ) : (
              <button
                className="btn btn-primary btn-lg"
                onClick={launch}
                disabled={launching || balance < cost}
              >
                {launching ? (
                  <><div className="spinner" style={{ width: 18, height: 18, borderTopColor: "white" }} /> Launching...</>
                ) : (
                  <><Rocket size={18} /> Launch Campaign</>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ReviewRow({ label, value, bold, highlight }) {
  return (
    <div className="review-row">
      <span className="review-label">{label}</span>
      <span
        className="review-value"
        style={{
          fontWeight: bold ? 700 : 500,
          color: highlight === "green"
            ? "#00a06b"
            : highlight === "red"
            ? "var(--red)"
            : "var(--text-primary)"
        }}
      >
        {value}
      </span>
    </div>
  );
}
