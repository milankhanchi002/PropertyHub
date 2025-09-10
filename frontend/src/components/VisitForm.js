import React, { useState } from "react";
import { bookVisit } from "../api";

export default function VisitForm({ propertyId }) {
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await bookVisit(propertyId, { date, notes });
      alert("Visit booked successfully!");
      setDate("");
      setNotes("");
    } catch (err) {
      console.error("Error booking visit:", err);
      alert("Failed to book visit: " + err.message);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Date:</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Notes:</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any special request"
        />
      </div>
      <button type="submit">Book Visit</button>
    </form>
  );
}
