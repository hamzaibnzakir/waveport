import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Rocket, TrendingUp, Users, Zap,
  ArrowUpRight, Plus, Activity, Clock
} from "lucide-react";
import {
  collection, query, where, orderBy,
  limit, onSnapshot, getDocs
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { format } from "date-fns";
import "./Dashboard.css";

const PLATFORM_COLORS = {
  facebook: "#1877F2",
  instagram: "#E1306C",
  tiktok: "#010101",
  twitter: "#1DA1F2",
  youtube: "#FF0000",
  reddit: "#FF4500",
  google: "#4285F4",
};

const STATUS_MAP = {
  active: { label: "Active", cls: "badge-active" },
  paused: { label: "Paused", cls: "badge-paused" },
  completed: { label: "Completed", cls: "badge-completed" },
  insufficient: { label: "Low Balance", cls: "badge-insufficient" },
};

function StatCard({ icon: Icon, label, value, sub, color, delay }) {
  return (
    <motion.div
      className="card stat-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
    >
      <div className="stat-icon" style={{ background: `${color}18`, color }}>
        <Icon size={20} />
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </motion.div>
  );
}

export default function Dashboard() {
  const { userProfile } = useAuth();
  const uid = userProfile?.uid;
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, delivered: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;

    const q = query(
      collection(db, "campaigns"),
      where("uid", "==", uid),
      orderBy("createdAt", "desc"),
      limit(5)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCampaigns(data);

      const active = data.filter((c) => c.status === "active").length;
      const delivered = data.reduce((sum, c) => sum + (c.deliveredCount || 0), 0);
      setStats({ total: data.length, active, delivered });
      setLoading(false);
    });

    return unsub;
  }, [uid]);

  const balance = typeof userProfile?.balance === "number"
    ? userProfile.balance.toFixed(2)
    : "0.00";

  return (
    <div className="page-body">
      {/* Page header */}
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1>Dashboard</h1>
        <p>Welcome back{userProfile?.name ? `, ${userProfile.name.split(" ")[0]}` : ""}. Here's your overview.</p>
      </motion.div>

      {/* Balance + quick action */}
      <motion.div
        className="balance-hero card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
      >
        <div className="balance-hero-glow" />
        <div className="balance-hero-content">
          <div>
            <p className="balance-label">Account Balance</p>
            <p className="balance-amount">${balance}</p>
            <p className="balance-sub">Available for campaigns</p>
          </div>
          <div className="balance-actions">
            <Link to="/wallet" className="btn btn-primary btn-lg">
              <Plus size={18} />
              Add Funds
            </Link>
            <Link to="/campaigns/new" className="btn btn-outline btn-lg">
              <Rocket size={18} />
              New Campaign
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="stats-grid">
        <StatCard
          icon={Rocket}
          label="Total Campaigns"
          value={stats.total}
          sub="All time"
          color="var(--blue-brand)"
          delay={0.1}
        />
        <StatCard
          icon={Activity}
          label="Active Now"
          value={stats.active}
          sub="Running campaigns"
          color="var(--accent-emerald)"
          delay={0.15}
        />
        <StatCard
          icon={Users}
          label="Traffic Delivered"
          value={stats.delivered.toLocaleString()}
          sub="Total visitors"
          color="var(--accent-cyan)"
          delay={0.2}
        />
        <StatCard
          icon={TrendingUp}
          label="Wallet Balance"
          value={`$${balance}`}
          sub="Current balance"
          color="var(--accent-amber)"
          delay={0.25}
        />
      </div>

      {/* Recent campaigns */}
      <motion.div
        className="section-block"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="section-header">
          <h2>Recent Campaigns</h2>
          <Link to="/campaigns" className="btn btn-ghost btn-sm">
            View all <ArrowUpRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="spinner" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="empty-state">
            <Rocket size={36} style={{ color: "var(--border-mid)", marginBottom: 12 }} />
            <p>No campaigns yet.</p>
            <Link to="/campaigns/new" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
              Launch your first campaign
            </Link>
          </div>
        ) : (
          <div className="campaigns-table-wrap">
            <table className="campaigns-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Platform</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const pct = c.volume > 0
                    ? Math.min(100, Math.round((c.deliveredCount || 0) / c.volume * 100))
                    : 0;
                  const status = STATUS_MAP[c.status] || STATUS_MAP.paused;
                  const platformColor = PLATFORM_COLORS[c.platform] || "var(--blue-brand)";
                  const createdAt = c.createdAt?.toDate?.() || new Date();

                  return (
                    <tr key={c.id}>
                      <td>
                        <div className="camp-name">{c.name}</div>
                        <div className="camp-url">{c.url}</div>
                      </td>
                      <td>
                        <span className="platform-tag" style={{ borderColor: platformColor, color: platformColor }}>
                          {c.platform}
                        </span>
                      </td>
                      <td style={{ minWidth: 120 }}>
                        <div className="progress-bar" style={{ marginBottom: 4 }}>
                          <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {(c.deliveredCount || 0).toLocaleString()} / {(c.volume || 0).toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${status.cls}`}>
                          {status.label}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                        {format(createdAt, "MMM d, yyyy")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
