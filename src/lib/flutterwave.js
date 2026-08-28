// ─────────────────────────────────────────────────────────────────────────────
// FLUTTERWAVE SETUP — PLUG YOUR KEY HERE
//
// Steps:
//  1. Go to https://dashboard.flutterwave.com
//  2. Settings → API Keys → copy your PUBLIC key
//  3. Replace "YOUR_FLUTTERWAVE_PUBLIC_KEY" below
//
// Note: Never put your SECRET key in the frontend.
//       Secret key stays on your Railway backend only.
// ─────────────────────────────────────────────────────────────────────────────

export const FLUTTERWAVE_PUBLIC_KEY = "FLWPUBK-1692dc0dae67e2327401a155af86e68e-X";

// Backend base URL. Set VITE_API_BASE_URL when Railway provides the API domain.
// Example: VITE_API_BASE_URL=https://flowboost-backend-production.up.railway.app
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
