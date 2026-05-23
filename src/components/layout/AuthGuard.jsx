import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AuthGuard({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--blue-deep)"
      }}>
        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
          <div className="spinner" style={{ margin: "0 auto 12px", borderTopColor: "var(--blue-brand)" }} />
          <p style={{ fontSize: "0.85rem" }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}
