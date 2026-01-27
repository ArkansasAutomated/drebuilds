import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Auto-redirect clean URLs to hash-based URLs for HashRouter compatibility
const { pathname, search, hash } = window.location;

// If there's a pathname (not just "/") and no hash, redirect to hash-equivalent
if (pathname !== "/" && !hash) {
  // Redirect /admin → /#/admin, /auth?foo=bar → /#/auth?foo=bar
  window.location.replace(window.location.origin + "/#" + pathname + search);
} else {
  // Render the app normally
  createRoot(document.getElementById("root")!).render(<App />);
}
