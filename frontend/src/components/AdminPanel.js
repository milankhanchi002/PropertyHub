import React, { useEffect, useState } from "react";
import { getAdminProperties, toggleProperty, deleteProperty, updateProperty, createProperty } from "../api";

export default function AdminPanel() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProperty, setEditingProperty] = useState(null);
  const [newProperty, setNewProperty] = useState({
    title: "",
    city: "",
    type: "",
    price: 0,
    available: true,
    description: "",
    address: "",
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  async function fetchProperties() {
    try {
      setLoading(true);
      const data = await getAdminProperties();
      setProperties(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load properties: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(id) {
    try {
      await toggleProperty(id);
      fetchProperties();
    } catch (err) {
      console.error(err);
      alert("Failed to toggle availability: " + err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this property?")) return;
    try {
      await deleteProperty(id);
      fetchProperties();
    } catch (err) {
      console.error(err);
      alert("Failed to delete property: " + err.message);
    }
  }

  async function handleEdit(e) {
    e.preventDefault();
    try {
      await updateProperty(editingProperty.id, editingProperty);
      setEditingProperty(null);
      fetchProperties();
    } catch (err) {
      console.error(err);
      alert("Failed to update property: " + err.message);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      if (!user || !user.id) {
        return alert("Invalid admin user data.");
      }

      await createProperty(newProperty, user.id);
      alert("Property created successfully!");
      setNewProperty({
        title: "",
        city: "",
        type: "",
        price: 0,
        available: true,
        description: "",
        address: "",
      });
      fetchProperties();
    } catch (err) {
      console.error(err);
      alert("Failed to create property: " + err.message);
    }
  }

  if (loading) return <div>Loading admin properties...</div>;

  return (
    <div>
      <h2>Admin Panel - Manage Properties</h2>

      {/* Create New Property Form */}
      <div style={{ marginBottom: 20 }}>
        <h3>Create New Property</h3>
        <form onSubmit={handleCreate}>
          <input
            placeholder="Title"
            value={newProperty.title}
            onChange={(e) => setNewProperty({ ...newProperty, title: e.target.value })}
            required
          />
          <input
            placeholder="City"
            value={newProperty.city}
            onChange={(e) => setNewProperty({ ...newProperty, city: e.target.value })}
            required
          />
          <input
            placeholder="Type"
            value={newProperty.type}
            onChange={(e) => setNewProperty({ ...newProperty, type: e.target.value })}
            required
          />
          <input
            type="number"
            placeholder="Price"
            value={newProperty.price}
            onChange={(e) => setNewProperty({ ...newProperty, price: e.target.value })}
            required
          />
          <input
            placeholder="Description"
            value={newProperty.description}
            onChange={(e) => setNewProperty({ ...newProperty, description: e.target.value })}
          />
          <input
            placeholder="Address"
            value={newProperty.address}
            onChange={(e) => setNewProperty({ ...newProperty, address: e.target.value })}
          />
          <label>
            Available:
            <input
              type="checkbox"
              checked={newProperty.available}
              onChange={(e) => setNewProperty({ ...newProperty, available: e.target.checked })}
            />
          </label>
          <button type="submit">Create Property</button>
        </form>
      </div>

      {properties.length === 0 ? (
        <p>No properties found.</p>
      ) : (
        <table border="1" cellPadding="6" style={{ marginTop: 10 }}>
          <thead>
            <tr>
              <th>Title</th>
              <th>City</th>
              <th>Type</th>
              <th>Price</th>
              <th>Available</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((p) => (
              <tr key={p.id}>
                <td>{p.title}</td>
                <td>{p.city}</td>
                <td>{p.type}</td>
                <td>{p.price}</td>
                <td>{p.available ? "Yes" : "No"}</td>
                <td>
                  <button onClick={() => handleToggle(p.id)}>
                    {p.available ? "Mark Unavailable" : "Mark Available"}
                  </button>
                  <button onClick={() => setEditingProperty(p)}>Edit</button>
                  <button onClick={() => handleDelete(p.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Edit Property Form */}
      {editingProperty && (
        <div style={{ marginTop: 20 }}>
          <h3>Edit Property</h3>
          <form onSubmit={handleEdit}>
            <input
              placeholder="Title"
              value={editingProperty.title}
              onChange={(e) => setEditingProperty({ ...editingProperty, title: e.target.value })}
              required
            />
            <input
              placeholder="City"
              value={editingProperty.city}
              onChange={(e) => setEditingProperty({ ...editingProperty, city: e.target.value })}
              required
            />
            <input
              placeholder="Type"
              value={editingProperty.type}
              onChange={(e) => setEditingProperty({ ...editingProperty, type: e.target.value })}
              required
            />
            <input
              placeholder="Price"
              type="number"
              value={editingProperty.price}
              onChange={(e) => setEditingProperty({ ...editingProperty, price: e.target.value })}
              required
            />
            <label>
              Available:
              <input
                type="checkbox"
                checked={editingProperty.available}
                onChange={(e) => setEditingProperty({ ...editingProperty, available: e.target.checked })}
              />
            </label>
            <button type="submit">Save</button>
            <button type="button" onClick={() => setEditingProperty(null)}>
              Cancel
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
