import React, { useState } from "react";
import { createLease } from "../api";

export default function LeaseForm({ propertyId, onSuccess }) {
  const [form, setForm] = useState({
    tenantName: "",
    tenantEmail: "",
    startDate: "",
    endDate: "",
    monthlyRent: ""
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
      const leaseData = {
        tenantName: form.tenantName,
        tenantEmail: form.tenantEmail,
        startDate: form.startDate,
        endDate: form.endDate,
        monthlyRent: parseFloat(form.monthlyRent)
      };

      await createLease(propertyId, leaseData);
      
      if (onSuccess) onSuccess();
      
      // Reset form
      setForm({
        tenantName: user?.name || "",
        tenantEmail: user?.email || "",
        startDate: "",
        endDate: "",
        monthlyRent: ""
      });
    } catch (err) {
      console.error("Error creating lease:", err);
      setError(err.message || "Failed to create lease application");
    } finally {
      setLoading(false);
    }
  }

  // Get minimum date (today)
  const today = new Date().toISOString().slice(0, 10);

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
          <label className="form-label">Lease Start Date</label>
          <input
            type="date"
            name="startDate"
            value={form.startDate}
            onChange={handleChange}
            min={today}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Lease End Date</label>
          <input
            type="date"
            name="endDate"
            value={form.endDate}
            onChange={handleChange}
            min={form.startDate || today}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Proposed Monthly Rent ($)</label>
          <input
            type="number"
            name="monthlyRent"
            placeholder="Enter proposed monthly rent"
            value={form.monthlyRent}
            onChange={handleChange}
            min="0"
            step="0.01"
            required
          />
        </div>

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
                Submitting Application...
              </>
            ) : (
              "📋 Submit Lease Application"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
