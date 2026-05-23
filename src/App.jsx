import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import AuthGuard from "./components/layout/AuthGuard";
import Sidebar from "./components/layout/Sidebar";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Campaigns from "./pages/Campaigns";
import NewCampaign from "./pages/NewCampaign";
import Wallet from "./pages/Wallet";
import Settings from "./pages/Settings";
import "./styles/globals.css";

// Layout wrapper for all protected pages
function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="mobile-header-spacer" style={{ height: "var(--header-height)", display: "none" }} />
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Auth />} />
          <Route path="/signup" element={<Auth />} />

          <Route
            element={
              <AuthGuard>
                <AppLayout />
              </AuthGuard>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/campaigns/new" element={<NewCampaign />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        <Toaster
          position="top-right"
          toastOptions={{
            className: "toast-custom",
            duration: 3500,
            style: {
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.875rem",
              borderRadius: "12px",
              boxShadow: "0 8px 32px rgba(10,22,40,0.14)",
            },
            success: { iconTheme: { primary: "#00a06b", secondary: "#fff" } },
            error: { iconTheme: { primary: "#ff4d6a", secondary: "#fff" } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
