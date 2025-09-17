import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import PropertyList from './components/PropertyList';
import PropertyForm from './components/PropertyForm';
import PropertyDetail from './components/PropertyDetail';
import AdminPanel from './components/AdminPanel';
import AuthForm from './components/AuthForm';

import './style.css';

// A reusable component for protected routes
function ProtectedRoute({ user, requiredRole, children }) {
  if (!user) {
    // Redirect to login if not authenticated
    return <AuthForm />;
  }
  if (requiredRole && user.role !== requiredRole) {
    // Redirect to home if user role doesn't match
    return <PropertyList />;
  }
  return children;
}

function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // On initial app load, check localStorage for a logged-in user
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.warn("Invalid user data in localStorage, clearing it.");
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  }, []); // The empty array [] means this effect runs only once

  // A smooth, reactive logout function
  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null); // Update state to trigger re-render
    navigate('/'); // Navigate to home without a page refresh
  }

  // This function will be passed to AuthForm to update the app state on login
  function handleLoginSuccess(loggedInUser) {
    setUser(loggedInUser);
  }

  return (
    <div className="app-container">
      {/* Navbar */}
      <header className="navbar">
        <Link to="/" className="logo-text">PropertyHub</Link>
        <nav>
          <Link to="/">Home</Link>
          {user && <Link to="/post">Post Property</Link>}
          {user?.role === "ADMIN" && <Link to="/admin">Admin</Link>}

          {!user ? (
            <Link to="/auth">Login / Register</Link>
          ) : (
            <button className="logout-btn" onClick={logout}>
              Logout ({user.name})
            </button>
          )}
        </nav>
      </header>

      {/* Main content area where routes are rendered */}
      <main className="content">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PropertyList />} />
          <Route path="/property/:id" element={<PropertyDetail />} />

          {/* Auth Route */}
          <Route
            path="/auth"
            element={<AuthForm onLoginSuccess={handleLoginSuccess} />}
          />

          {/* Protected Routes */}
          <Route
            path="/post"
            element={
              <ProtectedRoute user={user}>
                <PropertyForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute user={user} requiredRole="ADMIN">
                <AdminPanel />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>©️ 2025 PropertyHub, a subsidiary of Gemini Industries. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;