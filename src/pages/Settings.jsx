import { useState } from "react";
import { motion } from "framer-motion";
import {
  User, Lock, Bell, Trash2, Save,
  Eye, EyeOff, Shield, CheckCircle
} from "lucide-react";
import {
  updateProfile, updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser
} from "firebase/auth";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "./Settings.css";

export default function Settings() {
  const { user, userProfile, refreshProfile, logout } = useAuth();
  const navigate = useNavigate();
  const isGoogleUser = user?.providerData?.[0]?.providerId === "google.com";

  // Profile form
  const [name, setName] = useState(userProfile?.name || "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwErrors, setPwErrors] = useState({});
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [savingPw, setSavingPw] = useState(false);

  // Notifications
  const [notifs, setNotifs] = useState({
    balance_low: true,
    campaign_paused: true,
    campaign_complete: true,
  });

  async function saveProfile() {
    if (!name.trim()) { toast.error("Name cannot be empty"); return; }
    setSavingProfile(true);
    try {
      await updateProfile(auth.currentUser, { displayName: name.trim() });
      await updateDoc(doc(db, "users", user.uid), { name: name.trim() });
      await refreshProfile();
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  }

  function validatePw() {
    const errs = {};
    if (!pwForm.current) errs.current = "Enter your current password";
    if (!pwForm.next) errs.next = "Enter a new password";
    else if (pwForm.next.length < 6) errs.next = "Must be at least 6 characters";
    if (pwForm.next !== pwForm.confirm) errs.confirm = "Passwords do not match";
    return errs;
  }

  async function changePassword() {
    const errs = validatePw();
    if (Object.keys(errs).length) { setPwErrors(errs); return; }
    setSavingPw(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, pwForm.current);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, pwForm.next);
      setPwForm({ current: "", next: "", confirm: "" });
      setPwErrors({});
      toast.success("Password changed successfully");
    } catch (err) {
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setPwErrors({ current: "Incorrect current password" });
      } else {
        toast.error("Failed to change password");
      }
    } finally {
      setSavingPw(false);
    }
  }

  async function deleteAccount() {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This is permanent and cannot be undone."
    );
    if (!confirmed) return;
    try {
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(auth.currentUser);
      toast.success("Account deleted");
      navigate("/login");
    } catch (err) {
      if (err.code === "auth/requires-recent-login") {
        toast.error("Please sign out and sign back in before deleting your account.");
      } else {
        toast.error("Failed to delete account");
      }
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
        <h1>Settings</h1>
        <p>Manage your account preferences.</p>
      </motion.div>

      <div className="settings-layout">

        {/* ── Profile Card ── */}
        <motion.div
          className="card settings-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <div className="settings-card-header">
            <div className="settings-card-icon" style={{ background: "rgba(29,92,245,0.08)", color: "var(--blue-brand)" }}>
              <User size={18} />
            </div>
            <div>
              <h2>Profile</h2>
              <p>Update your display name and account info.</p>
            </div>
          </div>

          {/* Avatar */}
          <div className="settings-avatar-row">
            <div className="settings-avatar">
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} alt={userProfile.name} />
              ) : (
                <span>{(userProfile?.name || userProfile?.email || "U")[0].toUpperCase()}</span>
              )}
            </div>
            <div>
              <p className="settings-avatar-name">{userProfile?.name || "—"}</p>
              <p className="settings-avatar-email">{userProfile?.email}</p>
              {isGoogleUser && (
                <span className="badge badge-active" style={{ marginTop: 6, display: "inline-flex" }}>
                  <CheckCircle size={11} /> Google Account
                </span>
              )}
            </div>
          </div>

          <div className="settings-fields">
            <div className="input-group">
              <label>Display Name</label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />
            </div>
            <div className="input-group">
              <label>Email Address</label>
              <input
                className="input"
                value={userProfile?.email || ""}
                disabled
                style={{ opacity: 0.6, cursor: "not-allowed" }}
              />
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Email cannot be changed here.
              </span>
            </div>
          </div>

          <div className="settings-card-footer">
            <button
              className="btn btn-primary"
              onClick={saveProfile}
              disabled={savingProfile}
            >
              {savingProfile ? (
                <div className="spinner" style={{ width: 16, height: 16, borderTopColor: "white" }} />
              ) : (
                <><Save size={15} /> Save Changes</>
              )}
            </button>
          </div>
        </motion.div>

        {/* ── Password Card ── */}
        {!isGoogleUser && (
          <motion.div
            className="card settings-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="settings-card-header">
              <div className="settings-card-icon" style={{ background: "rgba(0,229,160,0.1)", color: "#00a06b" }}>
                <Lock size={18} />
              </div>
              <div>
                <h2>Change Password</h2>
                <p>Keep your account secure.</p>
              </div>
            </div>

            <div className="settings-fields">
              {[
                { key: "current", label: "Current Password", placeholder: "Your current password" },
                { key: "next", label: "New Password", placeholder: "At least 6 characters" },
                { key: "confirm", label: "Confirm New Password", placeholder: "Repeat new password" },
              ].map(({ key, label, placeholder }) => (
                <div className="input-group" key={key}>
                  <label>{label}</label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <input
                      className={`input ${pwErrors[key] ? "error" : ""}`}
                      type={showPw[key] ? "text" : "password"}
                      placeholder={placeholder}
                      value={pwForm[key]}
                      onChange={(e) => {
                        setPwForm((f) => ({ ...f, [key]: e.target.value }));
                        if (pwErrors[key]) setPwErrors((e2) => ({ ...e2, [key]: "" }));
                      }}
                      style={{ paddingRight: 40 }}
                    />
                    <button
                      type="button"
                      style={{
                        position: "absolute", right: 12,
                        color: "var(--text-muted)", cursor: "pointer",
                        display: "flex", alignItems: "center", padding: 4, borderRadius: 4
                      }}
                      onClick={() => setShowPw((s) => ({ ...s, [key]: !s[key] }))}
                      tabIndex={-1}
                    >
                      {showPw[key] ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {pwErrors[key] && <span className="input-error">{pwErrors[key]}</span>}
                </div>
              ))}
            </div>

            <div className="settings-card-footer">
              <button
                className="btn btn-primary"
                onClick={changePassword}
                disabled={savingPw}
              >
                {savingPw ? (
                  <div className="spinner" style={{ width: 16, height: 16, borderTopColor: "white" }} />
                ) : (
                  <><Lock size={15} /> Update Password</>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Notifications Card ── */}
        <motion.div
          className="card settings-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <div className="settings-card-header">
            <div className="settings-card-icon" style={{ background: "rgba(255,179,71,0.12)", color: "var(--accent-amber)" }}>
              <Bell size={18} />
            </div>
            <div>
              <h2>Notifications</h2>
              <p>Choose what alerts you receive.</p>
            </div>
          </div>

          <div className="notif-list">
            {[
              { key: "balance_low", label: "Low Balance Alert", desc: "Notify when balance drops below $5" },
              { key: "campaign_paused", label: "Campaign Paused", desc: "Notify when a campaign pauses due to low balance" },
              { key: "campaign_complete", label: "Campaign Completed", desc: "Notify when a campaign finishes delivery" },
            ].map(({ key, label, desc }) => (
              <div key={key} className="notif-item">
                <div>
                  <p className="notif-label">{label}</p>
                  <p className="notif-desc">{desc}</p>
                </div>
                <button
                  className={`toggle ${notifs[key] ? "toggle--on" : ""}`}
                  onClick={() => setNotifs((n) => ({ ...n, [key]: !n[key] }))}
                  aria-label={`Toggle ${label}`}
                >
                  <span className="toggle-thumb" />
                </button>
              </div>
            ))}
          </div>

          <div className="settings-card-footer">
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Email notification delivery coming soon.
            </p>
          </div>
        </motion.div>

        {/* ── Danger Zone ── */}
        <motion.div
          className="card settings-card settings-card--danger"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="settings-card-header">
            <div className="settings-card-icon" style={{ background: "rgba(255,77,106,0.1)", color: "var(--red)" }}>
              <Shield size={18} />
            </div>
            <div>
              <h2>Danger Zone</h2>
              <p>Irreversible account actions.</p>
            </div>
          </div>

          <div className="danger-item">
            <div>
              <p className="notif-label">Delete Account</p>
              <p className="notif-desc">
                Permanently delete your account and all associated data.
                Active campaigns will be cancelled. This cannot be undone.
              </p>
            </div>
            <button
              className="btn btn-danger btn-sm"
              onClick={deleteAccount}
              style={{ flexShrink: 0 }}
            >
              <Trash2 size={14} /> Delete Account
            </button>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
