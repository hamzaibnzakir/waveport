import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Rocket, Search, Pause, Play, X,
  ExternalLink, Filter, ChevronDown
} from "lucide-react";
import {
  collection, query, where, orderBy,
  onSnapshot, doc, updateDoc
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { format } from "date-fns";
import toast from "react-hot-toast";
import "./Campaigns.css";

const PLATFORM_COLORS = {
  facebook: "#1877F2", instagram: "#E1306C", tiktok: "#010101",
  twitter: "#1DA1F2", youtube: "#FF0000", reddit: "#FF4500", google: "#4285F4",
};

const STATUS_MAP = {
  active:      { label: "Active",        cls: "badge-active" },
  paused:      { label: "Paused",        cls: "badge-paused" },
  completed:   { label: "Completed",     cls: "badge-completed" },
  insufficient:{ label: "Low Balance",   cls: "badge-insufficient" },
  cancelled:   { label: "Cancelled",     cls: "badge-paused" },
};

const DELIVERY_LABELS = {
  burst_24hr: "24hr Burst",
  scheduled: "Scheduled",
};

export default function Campaigns() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "campaigns"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setCampaigns(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [user]);

  async function togglePause(campaign) {
    const newStatus = campaign.status === "active" ? "paused" : "active";
    setUpdating(campaign.id);
    try {
      await updateDoc(doc(db, "campaigns", campaign.id), { status: newStatus });
      toast.success(newStatus === "active" ? "Campaign resumed" : "Campaign paused");
    } catch {
      toast.error("Failed to update campaign");
    } finally {
      setUpdating(null);
    }
  }

  async function cancelCampaign(campaign) {
    if (!confirm(`Cancel "${campaign.name}"? This cannot be undone.`)) return;
    setUpdating(campaign.id);
    try {
      await updateDoc(doc(db, "campaigns", campaign.id), { status: "cancelled" });
      toast.success("Campaign cancelled");
    } catch {
      toast.error("Failed to cancel campaign");
    } finally {
      setUpdating(null);
    }
  }

  const filtered = campaigns.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.url.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="page-body">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1>My Campaigns</h1>
            <p>Manage and monitor all your traffic campaigns.</p>
          </div>
          <Link to="/campaigns/new" className="btn btn-primary">
            <Rocket size={16} /> New Campaign
          </Link>
        </div>
      </motion.div>

      {/* Filters row */}
      <motion.div
        className="campaigns-toolbar"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <div className="search-wrap">
          <Search size={15} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-wrap">
          <Filter size={14} />
          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="insufficient">Low Balance</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <ChevronDown size={14} />
        </div>
      </motion.div>

      {/* Campaign cards */}
      {loading ? (
        <div className="empty-state" style={{ marginTop: 60 }}>
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 80 }}>
          <Rocket size={40} style={{ color: "var(--border-mid)", marginBottom: 14 }} />
          <p style={{ fontSize: "1rem", fontWeight: 600 }}>
            {search || filterStatus !== "all" ? "No campaigns match your filter." : "No campaigns yet."}
          </p>
          {!search && filterStatus === "all" && (
            <Link to="/campaigns/new" className="btn btn-primary" style={{ marginTop: 16 }}>
              Launch your first campaign
            </Link>
          )}
        </div>
      ) : (
        <div className="campaign-cards">
          {filtered.map((c, i) => {
            const pct = c.volume > 0
              ? Math.min(100, Math.round((c.deliveredCount || 0) / c.volume * 100))
              : 0;
            const status = STATUS_MAP[c.status] || STATUS_MAP.paused;
            const platformColor = PLATFORM_COLORS[c.platform] || "var(--blue-brand)";
            const canToggle = c.status === "active" || c.status === "paused";
            const createdAt = c.createdAt?.toDate?.() || new Date();

            return (
              <motion.div
                key={c.id}
                className="campaign-card card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
              >
                {/* Header */}
                <div className="camp-card-header">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <h3 className="camp-card-name">{c.name}</h3>
                      <span className={`badge ${status.cls}`}>{status.label}</span>
                    </div>
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="camp-card-url"
                    >
                      {c.url} <ExternalLink size={11} />
                    </a>
                  </div>

                  {/* Actions */}
                  <div className="camp-card-actions">
                    {canToggle && (
                      <button
                        className={`btn btn-sm ${c.status === "active" ? "btn-outline" : "btn-primary"}`}
                        onClick={() => togglePause(c)}
                        disabled={updating === c.id}
                      >
                        {updating === c.id ? (
                          <div className="spinner" style={{ width: 14, height: 14 }} />
                        ) : c.status === "active" ? (
                          <><Pause size={13} /> Pause</>
                        ) : (
                          <><Play size={13} /> Resume</>
                        )}
                      </button>
                    )}
                    {c.status !== "completed" && c.status !== "cancelled" && (
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => cancelCampaign(c)}
                        disabled={updating === c.id}
                        style={{ color: "var(--red)" }}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Meta row */}
                <div className="camp-card-meta">
                  <span
                    className="platform-tag"
                    style={{ borderColor: platformColor, color: platformColor, fontSize: "0.72rem" }}
                  >
                    {c.platform}
                  </span>
                  <span className="camp-meta-item">
                    {DELIVERY_LABELS[c.deliveryType] || c.deliveryType}
                    {c.deliveryType === "scheduled" && ` · ${c.duration}d`}
                  </span>
                  <span className="camp-meta-item">
                    Started {format(createdAt, "MMM d, yyyy")}
                  </span>
                  <span className="camp-meta-item">
                    ${(c.costTotal || 0).toFixed(2)} total
                  </span>
                </div>

                {/* Progress */}
                <div className="camp-card-progress">
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: "0.8rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>Traffic Progress</span>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                      {(c.deliveredCount || 0).toLocaleString()} / {(c.volume || 0).toLocaleString()} visitors
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div style={{ textAlign: "right", marginTop: 4, fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {pct}% complete
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
