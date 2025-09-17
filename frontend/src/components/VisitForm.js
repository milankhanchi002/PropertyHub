import React, { useState } from "react";
import { bookVisit } from "../api";

export default function VisitForm({ propertyId, onSuccess }) {
  const [form, setForm] = useState({
    tenantName: "",
    tenantEmail: "",
    visitDateTime: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  // Pre-fill user data if available
  React.useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        tenantName: user.name || "",
        tenantEmail: user.email || ""
      }));
    }
  }, [user]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const visitData = {
        tenantName: form.tenantName,
        tenantEmail: form.tenantEmail,
        visitDateTime: form.visitDateTime
      };

      await bookVisit(propertyId, visitData);
      
      if (onSuccess) onSuccess();
      
      // Reset form
      setForm({
        tenantName: user?.name || "",
        tenantEmail: user?.email || "",
        visitDateTime: ""
      });
    } catch (err) {
      console.error("Error booking visit:", err);
      setError(err.message || "Failed to book visit");
    } finally {
      setLoading(false);
    }
  }

  // Get minimum date (today)
  const today = new Date().toISOString().slice(0, 16);

  return (
    <div>
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

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Your Name</label>
          <input
            type="text"
            name="tenantName"
            placeholder="Enter your full name"
            value={form.tenantName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Your Email</label>
          <input
            type="email"
            name="tenantEmail"
            placeholder="Enter your email address"
            value={form.tenantEmail}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Preferred Visit Date & Time</label>
          <input
            type="datetime-local"
            name="visitDateTime"
            value={form.visitDateTime}
            onChange={handleChange}
            min={today}
            required
          />
        </div>

        {/* Notes removed to align with Visit model */}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button 
            type="button" 
            onClick={onSuccess}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="loading"></span>
                Booking Visit...
              </>
            ) : (
              "📅 Book Visit"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
