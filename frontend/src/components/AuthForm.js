import React, { useState } from "react";
import { registerUser, loginUser } from "../api";

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "TENANT" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const res = isLogin
        ? await loginUser({ email: form.email, password: form.password })
        : await registerUser(form);

      if (res.error) {
        setError(res.error);
        return;
      }

      // store auth details
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));

      // Redirect based on role
      if (res.user?.role === "ADMIN") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/";
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="content">
      <div className="form-container">
        <div className="text-center mb-6">
          <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p style={{ color: '#6b7280' }}>
            {isLogin ? "Sign in to your PropertyHub account" : "Join PropertyHub to find your perfect home"}
          </p>
        </div>

        {error && (
          <div style={{ 
            background: '#fee2e2', 
            color: '#991b1b', 
            padding: '0.75rem', 
            borderRadius: '0.5rem', 
            marginBottom: '1.5rem',
            border: '1px solid #fecaca'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={submit}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                name="name"
                placeholder="Enter your full name"
                value={form.name}
                onChange={change}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              name="email"
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={change}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              name="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={change}
              type="password"
              required
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Account Type</label>
              <select name="role" value={form.role} onChange={change}>
                <option value="TENANT">Tenant - Looking for properties</option>
                <option value="OWNER">Owner - List my properties</option>
                <option value="AGENT">Agent - Real estate professional</option>
              </select>
            </div>
          )}

          <button type="submit" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
            {loading ? (
              <>
                <span className="loading"></span>
                {isLogin ? "Signing In..." : "Creating Account..."}
              </>
            ) : (
              isLogin ? "Sign In" : "Create Account"
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setForm({ name: "", email: "", password: "", role: "TENANT" });
            }}
            className="btn-secondary"
            style={{ background: 'transparent', color: '#667eea', textDecoration: 'underline' }}
          >
            {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
