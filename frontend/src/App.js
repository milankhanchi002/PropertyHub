import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import PropertyList from './components/PropertyList';
import PropertyForm from './components/PropertyForm';
import PropertyDetail from './components/PropertyDetail';
import AdminPanel from './components/AdminPanel';
import AuthForm from './components/AuthForm';

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
    <div className="container">
      {/* Navigation */}
      <nav style={{ marginBottom: 20 }}>
        <Link to="/">Home</Link>

        {user && (
          <>
            {" | "}
            <Link to="/post">Post Property</Link>
          </>
        )}

        {user?.role === "ADMIN" && (
          <>
            {" | "}
            <Link to="/admin">Admin</Link>
          </>
        )}

        {!user && (
          <>
            {" | "}
            <Link to="/auth">Auth</Link>
          </>
        )}

        {user && (
          <button onClick={logout} style={{ marginLeft: 10 }}>
            Logout
          </button>
        )}
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<PropertyList />} />
        <Route path="/post" element={user ? <PropertyForm /> : <AuthForm />} />
        <Route path="/property/:id" element={<PropertyDetail />} />
        <Route
          path="/admin"
          element={user?.role === "ADMIN" ? <AdminPanel /> : <PropertyList />}
        />
        <Route path="/auth" element={<AuthForm />} />
      </Routes>
    </div>
  );
}

export default App;
