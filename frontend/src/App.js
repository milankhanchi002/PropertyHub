import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import PropertyList from './components/PropertyList';
import PropertyForm from './components/PropertyForm';
import PropertyDetail from './components/PropertyDetail';
import AdminPanel from './components/AdminPanel';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';
import { ToastProvider } from './components/Toast';

import './style.css';

function App() {
  let user = null;
  try {
    const storedUser = localStorage.getItem('user');
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch (err) {
    console.warn("Invalid user data in localStorage, clearing it.");
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    user = null;
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  }

  return (
    <ToastProvider>
      <div className="app-container">
        {/* Navbar */}
        <header className="navbar">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div className="logo-text">PropertyHub</div>
          </Link>

          <nav>
            <Link to="/">🏠 Properties</Link>
            {user && <Link to="/dashboard">📊 Dashboard</Link>}
            {(user?.role === "OWNER" || user?.role === "ADMIN") && <Link to="/post">➕ List Property</Link>}
            {user?.role === "ADMIN" && <Link to="/admin">⚙️ Admin</Link>}
            {!user ? (
              <Link to="/auth">🔐 Sign In</Link>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ color: '#4a5568', fontSize: '0.875rem' }}>Welcome, {user.name}</span>
                <button className="logout-btn" onClick={logout}>Sign Out</button>
              </div>
            )}
          </nav>
        </header>

        {/* Routes */}
        <Routes>
          <Route path="/" element={
            <>
              <section className="hero-properties">
                <div className="hero-text">
                  <h1>Find Your Perfect Home</h1>
                  <p style={{ fontSize: '1.25rem', color: '#4a5568', marginTop: '1rem' }}>
                    Discover amazing properties in your dream location
                  </p>
                </div>
              </section>
              <PropertyList />
            </>
          } />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/post" element={user ? <PropertyForm /> : <AuthForm />} />
          <Route path="/property/:id" element={<PropertyDetail />} />
          <Route path="/admin" element={user?.role === "ADMIN" ? <AdminPanel /> : <AuthForm />} />
          <Route path="/auth" element={<AuthForm />} />
        </Routes>

        {/* Footer */}
        <footer className="footer">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
            <p> 2025 PropertyHub. All rights reserved.</p>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <Link to="/" style={{ color: '#4a5568', textDecoration: 'none' }}>Properties</Link>
              <Link to="/auth" style={{ color: '#4a5568', textDecoration: 'none' }}>Sign In</Link>
              {user && <Link to="/dashboard" style={{ color: '#4a5568', textDecoration: 'none' }}>Dashboard</Link>}
            </div>
          </div>
        </footer>
      </div>
    </ToastProvider>
  );
}

export default App;