import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await API.post("/auth/register", { username, password });
      alert("Registration successful! Please log in.");
      navigate("/login");
    } catch (error) {
      alert(error.response?.data?.error || "Registration failed.");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", padding: "30px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px", color: "#0f172a" }}>📝 Register</h2>
      <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
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
          Register
        </button>
      </form>
      <p style={{ textAlign: "center", marginTop: "15px", fontSize: "14px", color: "#64748b" }}>
        Already have an account? <Link to="/login" style={{ color: "#3b4cca", fontWeight: "bold" }}>Login</Link>
      </p>
    </div>
  );
}