import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Rocket, List, Wallet,
  Settings, ChevronRight, LogOut, Menu, X,

} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import "./Sidebar.css";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/campaigns/new", icon: Rocket, label: "New Campaign" },
  { to: "/campaigns", icon: List, label: "My Campaigns" },
  { to: "/wallet", icon: Wallet, label: "Wallet" },
  { to: "/settings", icon: Settings, label: "Settings" },
];


export default function Sidebar() {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await logout();
    toast.success("Signed out");
    navigate("/login");
  }

  const sidebarContent = (
    <div className="sidebar-inner">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-mark">
          <Rocket size={18} />
        </div>
        <span className="logo-text">FlowBoost</span>
      </div>

      {/* User pill */}
      <div className="sidebar-user">
        <div className="user-avatar">
          {userProfile?.photoURL ? (
            <img src={userProfile.photoURL} alt={userProfile.name} />
          ) : (
            <span>{(userProfile?.name || userProfile?.email || "U")[0].toUpperCase()}</span>
          )}
        </div>
        <div className="user-info">
          <p className="user-name">{userProfile?.name || "User"}</p>
          <p className="user-balance">
            ${typeof userProfile?.balance === "number"
              ? userProfile.balance.toFixed(2)
              : "0.00"} balance
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <p className="nav-section-label">Menu</p>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/campaigns"}
            className={({ isActive }) =>
              `nav-item ${isActive ? "nav-item--active" : ""}`
            }
            onClick={() => setMobileOpen(false)}
          >
            <Icon size={18} />
            <span>{label}</span>
            <ChevronRight size={14} className="nav-chevron" />
          </NavLink>
        ))}

        <div className="sidebar-note">
          <span className="sidebar-note-dot" />
          <div><strong>Traffic desk</strong><small>Launch, fund, monitor.</small></div>
        </div>
      </nav>

      {/* Logout */}
      <button className="sidebar-logout" onClick={handleLogout}>
        <LogOut size={16} />
        <span>Sign Out</span>
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sidebar sidebar--desktop">{sidebarContent}</aside>

      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={22} />
        </button>
        <div className="sidebar-logo">
          <div className="logo-mark"><Rocket size={16} /></div>
          <span className="logo-text">FlowBoost</span>
        </div>
        <div className="mobile-balance">
          ${typeof userProfile?.balance === "number"
            ? userProfile.balance.toFixed(2)
            : "0.00"}
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="mobile-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="sidebar sidebar--mobile"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
            >
              <button
                className="mobile-close btn btn-ghost btn-icon"
                onClick={() => setMobileOpen(false)}
              >
                <X size={20} />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
