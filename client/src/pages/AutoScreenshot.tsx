import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function AutoScreenshot() {
  const [status, setStatus] = useState("Logging in...");
  const [, navigate] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect") || "/dashboard";

    async function autoLogin() {
      try {
        const res = await fetch("/api/auth/demo-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({}),
        });
        const data = await res.json();
        if (data.sessionToken) {
          localStorage.setItem("sessionToken", data.sessionToken);
        }
        if (data.demoSessionKey) {
          localStorage.setItem("demoSessionKey", data.demoSessionKey);
        }
        setStatus("Redirecting...");
        setTimeout(() => {
          window.location.href = redirect;
        }, 300);
      } catch (e) {
        setStatus("Error: " + String(e));
      }
    }

    autoLogin();
  }, []);

  return (
    <div style={{ background: "#0a0f1e", color: "#22d3ee", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", fontSize: 18 }}>
      {status}
    </div>
  );
}
