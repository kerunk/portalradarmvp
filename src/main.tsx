import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Hide fallback once React mounts successfully
const fallback = document.getElementById("app-fallback");
if (fallback) fallback.style.display = "none";
