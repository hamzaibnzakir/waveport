import { useState, Suspense } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, Rocket, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Scene3D from "../components/three/Scene3D";
import toast from "react-hot-toast";
import "./Auth.css";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function AuthPage() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});

  const { loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  const navigate = useNavigate();

  function setField(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  }

  function validate() {
    const errs = {};
    if (mode === "signup" && !form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Enter a valid email";
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 6) errs.password = "Password must be 6+ characters";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      if (mode === "login") {
        await loginWithEmail(form.email, form.password);
        toast.success("Welcome back!");
      } else {
        await registerWithEmail(form.email, form.password, form.name);
        toast.success("Account created! Welcome to FlowBoost.");
      }
      navigate("/dashboard");
    } catch (err) {
      const msg = {
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Incorrect password.",
        "auth/email-already-in-use": "An account already exists with this email.",
        "auth/too-many-requests": "Too many attempts. Please try again later.",
        "auth/invalid-credential": "Invalid email or password.",
      }[err.code] || "Something went wrong. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      await loginWithGoogle();
      toast.success("Signed in with Google!");
      navigate("/dashboard");
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        toast.error("Google sign-in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      {/* 3D Scene */}
      <div className="auth-3d-bg">
        <Suspense fallback={null}>
          <Scene3D />
        </Suspense>
      </div>

      {/* Gradient overlay */}
      <div className="auth-overlay" />

      {/* Split layout */}
      <div className="auth-layout">
        {/* Left — branding */}
        <motion.div
          className="auth-brand"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <div className="auth-brand-logo">
            <div className="logo-mark logo-mark--lg">
              <Rocket size={26} />
            </div>
            <span className="logo-text logo-text--lg">FlowBoost</span>
          </div>
          <h1 className="auth-headline">
            Launch<br />
            traffic<br />
            <span className="auth-headline-accent">with intent.</span>
          </h1>
          <p className="auth-sub">
            Send real visitors to the pages that matter.<br />
            Choose your source, pace, and reach.
          </p>

          <div className="auth-stats">
            {[
              { value: "01", label: "Destination first" },
              { value: "24h", label: "Burst delivery" },
              { value: "04", label: "Clear steps" },
            ].map(({ value, label }) => (
              <div key={label} className="auth-stat-item">
                <span className="auth-stat-value">{value}</span>
                <span className="auth-stat-label">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right — form card */}
        <motion.div
          className="auth-card-wrap"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <div className="auth-card card">
            {/* Tabs */}
            <div className="auth-tabs">
              <button
                className={`auth-tab ${mode === "login" ? "auth-tab--active" : ""}`}
                onClick={() => { setMode("login"); setErrors({}); }}
              >
                Sign In
              </button>
              <button
                className={`auth-tab ${mode === "signup" ? "auth-tab--active" : ""}`}
                onClick={() => { setMode("signup"); setErrors({}); }}
              >
                Create Account
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {/* Google button */}
                <button
                  className="btn btn-outline btn-full google-btn"
                  onClick={handleGoogle}
                  disabled={loading}
                >
                  <GoogleIcon />
                  Continue with Google
                </button>

                <div className="auth-divider">
                  <span>or continue with email</span>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} noValidate>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {mode === "signup" && (
                      <div className="input-group">
                        <label htmlFor="name">Full Name</label>
                        <div className="input-icon-wrap">
                          <User size={16} className="input-icon" />
                          <input
                            id="name"
                            className={`input input-with-icon ${errors.name ? "error" : ""}`}
                            type="text"
                            placeholder="Your full name"
                            value={form.name}
                            onChange={(e) => setField("name", e.target.value)}
                            autoComplete="name"
                          />
                        </div>
                        {errors.name && <span className="input-error">{errors.name}</span>}
                      </div>
                    )}

                    <div className="input-group">
                      <label htmlFor="email">Email Address</label>
                      <div className="input-icon-wrap">
                        <Mail size={16} className="input-icon" />
                        <input
                          id="email"
                          className={`input input-with-icon ${errors.email ? "error" : ""}`}
                          type="email"
                          placeholder="you@example.com"
                          value={form.email}
                          onChange={(e) => setField("email", e.target.value)}
                          autoComplete="email"
                        />
                      </div>
                      {errors.email && <span className="input-error">{errors.email}</span>}
                    </div>

                    <div className="input-group">
                      <label htmlFor="password">Password</label>
                      <div className="input-icon-wrap">
                        <Lock size={16} className="input-icon" />
                        <input
                          id="password"
                          className={`input input-with-icon input-with-icon-right ${errors.password ? "error" : ""}`}
                          type={showPass ? "text" : "password"}
                          placeholder={mode === "signup" ? "Min. 6 characters" : "Your password"}
                          value={form.password}
                          onChange={(e) => setField("password", e.target.value)}
                          autoComplete={mode === "signup" ? "new-password" : "current-password"}
                        />
                        <button
                          type="button"
                          className="input-icon-right"
                          onClick={() => setShowPass((v) => !v)}
                          tabIndex={-1}
                        >
                          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {errors.password && <span className="input-error">{errors.password}</span>}
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary btn-full btn-lg"
                      disabled={loading}
                      style={{ marginTop: 4 }}
                    >
                      {loading ? (
                        <div className="spinner" style={{ width: 18, height: 18, borderTopColor: "white" }} />
                      ) : (
                        <>
                          {mode === "login" ? "Sign In" : "Create Account"}
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {mode === "login" && (
                  <p className="auth-switch">
                    Don't have an account?{" "}
                    <button onClick={() => { setMode("signup"); setErrors({}); }}>
                      Sign up free
                    </button>
                  </p>
                )}
                {mode === "signup" && (
                  <p className="auth-switch">
                    Already have an account?{" "}
                    <button onClick={() => { setMode("login"); setErrors({}); }}>
                      Sign in
                    </button>
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
