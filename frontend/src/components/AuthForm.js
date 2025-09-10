import React, { useState } from "react";
import { registerUser, loginUser } from "../api";

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "TENANT" });
  const [loginAs, setLoginAs] = useState("USER"); // NEW: to choose Admin/User login

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function submit(e) {
    e.preventDefault();
    try {
      const res = isLogin
        ? await loginUser({ email: form.email, password: form.password })
        : await registerUser(form);

      if (res.error) return alert(res.error);

      // store auth details
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));

      alert(isLogin ? "Login successful" : "Registered & logged in");

      // 🚀 Redirect based on role/login type
      if (isLogin) {
        if (loginAs === "ADMIN" || res.user?.role === "ADMIN") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/";
        }
      } else {
        // registration → always redirect home
        window.location.href = "/";
      }
    } catch (err) {
      console.error(err);
      alert(err?.message || "Auth error");
    }
  }

  return (
    <div>
      <h2>{isLogin ? "Login" : "Register"}</h2>
      <form onSubmit={submit}>
        {!isLogin && (
          <input
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={change}
            required
          />
        )}

        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={change}
          required
        />

        <input
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={change}
          type="password"
          required
        />

        {!isLogin && (
          <select name="role" value={form.role} onChange={change}>
            <option value="TENANT">Tenant</option>
            <option value="OWNER">Owner</option>
            <option value="AGENT">Agent</option>
            <option value="ADMIN">Admin</option>
          </select>
        )}

        {isLogin && (
          <select value={loginAs} onChange={(e) => setLoginAs(e.target.value)}>
            <option value="USER">Login as User</option>
            <option value="ADMIN">Login as Admin</option>
          </select>
        )}

        <button type="submit">{isLogin ? "Login" : "Register"}</button>
      </form>

      <button onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? "Need an account? Register" : "Have account? Login"}
      </button>
    </div>
  );
}
