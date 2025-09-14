import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import PropertyList from './components/PropertyList';
import PropertyForm from './components/PropertyForm';
import PropertyDetail from './components/PropertyDetail';
import AdminPanel from './components/AdminPanel';
import AuthForm from './components/AuthForm';

import './style.css';

function App() {
  let user = null;
  try {
    const storedUser = localStorage.getItem('user');
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch (err) {
    console.warn("Invalid user data in localStorage, clearing it.");
    localStorage.removeItem('user');
    user = null;
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  }

  return (
    <div className="app-container">
      {/* Navbar */}
      <header className="navbar">

          <div className="logo-text">PropertyHub</div>

        <nav>
          <Link to="/">Home</Link>
          {user && <Link to="/post">Post Property</Link>}
          {user?.role === "ADMIN" && <Link to="/admin">Admin</Link>}
          {!user && <Link to="/auth">Login</Link>}
          {user && <button className="logout-btn" onClick={logout}>Logout</button>}
        </nav>
      </header>

      {/* Hero + Properties Section */}
      <section className="hero-properties">
        <div className="hero-text">
          <h1>Find Your Perfect Home</h1>
        </div>

        <div className="properties-container">
          <PropertyList />
        </div>
      </section>

      {/* Routes for other pages */}
      <main className="content">
        <Routes>
          <Route path="/post" element={user ? <PropertyForm /> : <AuthForm />} />
          <Route path="/property/:id" element={<PropertyDetail />} />
          <Route path="/admin" element={user?.role === "ADMIN" ? <AdminPanel /> : <PropertyList />} />
          <Route path="/auth" element={<AuthForm />} />

        </Routes>
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>©️ 2025 PropertyHub</p>
      </footer>
    </div>
  );
}

export default App;