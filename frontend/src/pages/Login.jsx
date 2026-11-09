import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/login", { username, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      alert("Logged in successfully!");
      navigate("/");
      window.location.reload();
    } catch (error) {
      alert(error.response?.data?.error || "Login failed.");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", padding: "30px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px", color: "#0f172a" }}>🔐 Login</h2>
      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
          required
        />
        <button type="submit" style={{ padding: "12px", background: "#3b4cca", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
          Login
        </button>
      </form>
      <p style={{ textAlign: "center", marginTop: "15px", fontSize: "14px", color: "#64748b" }}>
        Don't have an account? <Link to="/register" style={{ color: "#3b4cca", fontWeight: "bold" }}>Register</Link>
      </p>
    </div>
  );
}