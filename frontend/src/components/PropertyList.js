import React, { useState } from "react";
import { Link } from "react-router-dom";
import * as api from '../api'; // Assuming your api.js is in a parent/sibling folder

export default function PropertyList() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    city: "",
    type: "",
    minPrice: "",
    maxPrice: "",
  });

  async function fetchProperties() {
    setLoading(true);
    try {
      // Pass the filters object directly to the API call
      const data = await api.getProperties(filters);
      setProperties(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load properties: " + err.message);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value,
    }));
  }

  function handleSearch(e) {
    e.preventDefault();
    fetchProperties();
  }

  function handleReset() {
    setFilters({
      city: "",
      type: "",
      minPrice: "",
      maxPrice: "",
    });
    setProperties([]);
  }

  return (
    // Use a React Fragment as the main container is now in App.js
    <>
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '2rem' }}>
        Find Your Next Property
      </h2>

      {/* Search and Filter Form */}
      <div className="filter-container">
        <div className="filter-grid">
          {/* City Input */}
          <div className="form-group">
            <label htmlFor="city">City</label>
            <input
              id="city"
              name="city"
              type="text"
              placeholder="e.g., Miami"
              value={filters.city}
              onChange={handleInputChange}
            />
          </div>

          {/* Property Type Select */}
          <div className="form-group">
            <label htmlFor="type">Type</label>
            <select
              id="type"
              name="type"
              value={filters.type}
              onChange={handleInputChange}
            >
              <option value="">All Types</option>
              <option value="APARTMENT">Apartment</option>
              <option value="HOUSE">House</option>
              <option value="CONDO">Condo</option>
              <option value="VILLA">Villa</option>
            </select>
          </div>

          {/* Min & Max Price Inputs */}
          <div className="form-group">
            <label htmlFor="minPrice">Min Price</label>
            <input
              id="minPrice"
              name="minPrice"
              type="number"
              placeholder="No Min"
              value={filters.minPrice}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="maxPrice">Max Price</label>
            <input
              id="maxPrice"
              name="maxPrice"
              type="number"
              placeholder="No Max"
              value={filters.maxPrice}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="filter-actions">
          <button onClick={handleReset} className="btn btn-secondary">
            Reset
          </button>
          <button onClick={handleSearch} className="btn btn-primary">
            Search
          </button>
        </div>
      </div>

      {/* Property Listing */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '1rem' }}>Loading properties... ⏳</div>
      ) : properties.length === 0 ? (
        <p className="no-properties">No properties found. Try adjusting your filters.</p>
      ) : (
        <ul className="property-grid">
          {properties.map((p) => (
            <li key={p.id} className="property-card">
              <Link to={`/property/${p.id}`}>
                <h3>{p.title}</h3>
                <p className="address">{p.address}</p>
                <p className="details">
                  <span>{p.city}</span> | <span>{p.type}</span>
                </p>
                <div className="footer">
                  <span className="price">${p.price.toLocaleString()}</span>
                  <span className={`status-badge ${p.available ? 'status-available' : 'status-occupied'}`}>
                    {p.available ? 'Available' : 'Occupied'}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}