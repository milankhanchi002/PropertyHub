import React, { useState } from "react";
import { uploadPropertyImages } from "../api";

export default function PropertyForm() {
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    title: "",
    description: "",
    address: "",
    city: "",
    type: "HOUSE",
    price: "",
    available: true,
  });

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [files, setFiles] = useState([]);

  function change(e) {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  }

  async function submit(e) {
    e.preventDefault();

    if (!user || !token) {
      setStatusMessage("You must be logged in as OWNER or ADMIN to post a property.");
      return;
    }

    setLoading(true);
    setStatusMessage("Posting property...");

    try {
      const payload = { ...form, price: Number(form.price) };

      const res = await fetch(
        `http://localhost:8080/api/properties?ownerId=${user.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Status ${res.status}: ${errorText}`);
      }

      const data = await res.json();

      // If images were selected, upload them now
      if (files && files.length > 0) {
        try {
          setStatusMessage("Uploading images...");
          const uploaded = await uploadPropertyImages(data.id, files);
          setStatusMessage(`Property "${data.title}" posted with ${uploaded.length} image(s)!`);
        } catch (imgErr) {
          console.error(imgErr);
          setStatusMessage(`Property "${data.title}" posted, but image upload failed: ${imgErr.message}`);
        }
      } else {
        setStatusMessage(`Property "${data.title}" posted successfully!`);
      }

      setForm({
        title: "",
        description: "",
        address: "",
        city: "",
        type: "HOUSE",
        price: "",
        available: true,
      });
      setFiles([]);
    } catch (err) {
      console.error(err);
      setStatusMessage("Failed to post property: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: "500px", margin: "auto" }}>
      <h2>Post a Property</h2>
      <form onSubmit={submit}>
        <input name="title" placeholder="Title" value={form.title} onChange={change} required />
        <input name="description" placeholder="Description" value={form.description} onChange={change} required />
        <input name="address" placeholder="Address" value={form.address} onChange={change} required />
        <input name="city" placeholder="City" value={form.city} onChange={change} required />
        <select name="type" value={form.type} onChange={change}>
          <option value="HOUSE">House</option>
          <option value="APARTMENT">Apartment</option>
          <option value="VILLA">Villa</option>
          <option value="RENT">Rent</option>
          <option value="SALE">Sale</option>
        </select>
        <input name="price" type="number" placeholder="Price" value={form.price} onChange={change} required />
        <label>
          <input type="checkbox" name="available" checked={form.available} onChange={change} /> Available
        </label>
        <div style={{ marginTop: "0.75rem" }}>
          <label style={{ display: "block", marginBottom: "0.25rem" }}>Property Images</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
          />
          {files && files.length > 0 && (
            <p style={{ fontSize: "0.875rem", color: "#4a5568" }}>{files.length} file(s) selected</p>
          )}
        </div>
        <br />
        <button type="submit" disabled={loading}>{loading ? "Posting..." : "Post Property"}</button>
      </form>
      {statusMessage && <p>{statusMessage}</p>}
    </div>
  );
}
