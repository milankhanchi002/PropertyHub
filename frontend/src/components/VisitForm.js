import React, { useState } from "react";
import { bookVisit } from "../api"; // Make sure the path to your api.js is correct

export default function VisitForm({ propertyId }) {
  // Use a single state object for the form data
  const [formData, setFormData] = useState({
    tenantName: "",
    tenantEmail: "",
    visitDateTime: "",
  });

  // State for handling submission feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // A single handler for all input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(""); // Clear previous messages

    try {
      // The API call now sends the correct data structure
      await bookVisit(propertyId, formData);
      setMessage("Visit booked successfully! You will be contacted shortly.");

      // Reset the form after successful submission
      setFormData({
        tenantName: "",
        tenantEmail: "",
        visitDateTime: "",
      });
    } catch (err) {
      console.error("Error booking visit:", err);
      setMessage(`Failed to book visit: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="visit-form-container">
      <h3>Schedule a Viewing</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="tenantName">Full Name:</label>
          <input
            type="text"
            id="tenantName"
            name="tenantName"
            value={formData.tenantName}
            onChange={handleChange}
            required
            placeholder="John Doe"
          />
        </div>

        <div className="form-group">
          <label htmlFor="tenantEmail">Email Address:</label>
          <input
            type="email"
            id="tenantEmail"
            name="tenantEmail"
            value={formData.tenantEmail}
            onChange={handleChange}
            required
            placeholder="you@example.com"
          />
        </div>

        <div className="form-group">
          <label htmlFor="visitDateTime">Preferred Date and Time:</label>
          <input
            type="datetime-local" // This input captures both date and time
            id="visitDateTime"
            name="visitDateTime"
            value={formData.visitDateTime}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Booking..." : "Request Visit"}
        </button>
      </form>

      {/* Display success or error messages directly in the UI */}
      {message && (
        <p className={`form-message ${message.includes('Failed') ? 'error' : 'success'}`}>
          {message}
        </p>
      )}
    </div>
  );
}