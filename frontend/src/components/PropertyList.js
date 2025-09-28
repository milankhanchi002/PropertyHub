import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { searchProperties, getProperties } from "../api";

export default function PropertyList() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    city: "",
    type: "",
    minPrice: "",
    maxPrice: ""
  });

  const formatINR = (value) => {
    if (value === null || value === undefined) return '₹0';
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
    } catch {
      return `₹${Number(value).toLocaleString('en-IN')}`;
    }
  };

  function getPropertyImage(p) {
    // Prefer uploaded images if present
    if (p && Array.isArray(p.imageUrls) && p.imageUrls.length > 0) {
      const url = p.imageUrls[0];
      // If backend returned relative path like "/uploads/...", prefix host
      return url.startsWith("http") ? url : `http://localhost:8080${url}`;
    }
    const cityKey = (p.city || '').toLowerCase();
    const typeKey = (p.type || '').toLowerCase();
    const byType = {
      house: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1600&auto=format&fit=crop',
      apartment: 'https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1600&auto=format&fit=crop',
      villa: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=1600&auto=format&fit=crop',
    };
    const byCity = {
      'new york': 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=1600&auto=format&fit=crop',
      'san francisco': 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?q=80&w=1600&auto=format&fit=crop',
      'los angeles': 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1600&auto=format&fit=crop',
      'miami': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1600&auto=format&fit=crop',
      'seattle': 'https://images.unsplash.com/photo-1520975832066-6b2f54f0febb?q=80&w=1600&auto=format&fit=crop'
    };
    return byCity[cityKey] || byType[typeKey] || 'https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1600&auto=format&fit=crop';
  }

  useEffect(() => {
    loadProperties();
  }, []);

  async function loadProperties() {
    setLoading(true);
    try {
      const data = await getProperties(); // Load all properties initially
      setProperties(data);
    } catch (err) {
      console.error(err);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    setLoading(true);
    try {
      const searchFilters = {};
      if (filters.city) searchFilters.city = filters.city;
      if (filters.type) searchFilters.type = filters.type;
      if (filters.minPrice) searchFilters.min = filters.minPrice;
      if (filters.maxPrice) searchFilters.max = filters.maxPrice;
      
      const data = await searchProperties(searchFilters);
      setProperties(data);
    } catch (err) {
      console.error(err);
      alert("Search failed: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setFilters({
      city: "",
      type: "",
      minPrice: "",
      maxPrice: ""
    });
    loadProperties();
  }

  function handleFilterChange(field, value) {
    setFilters(prev => ({ ...prev, [field]: value }));
  }

  return (
    <div className="properties-container">
      <h2 className="text-center mb-6" style={{ fontSize: '2.5rem', fontWeight: '800', color: '#1a202c' }}>Available Properties</h2>

      {/* Advanced Search Filters */}
      <div className="search-container">
        <h3 className="mb-4" style={{ fontSize: '1.25rem', fontWeight: '600', color: '#374151' }}>Search & Filter Properties</h3>
        <div className="search-grid">
          <div className="form-group">
            <label className="form-label">City</label>
            <input
              type="text"
              placeholder="Enter city name"
              value={filters.city}
              onChange={(e) => handleFilterChange('city', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Property Type</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="HOUSE">House</option>
              <option value="APARTMENT">Apartment</option>
              <option value="VILLA">Villa</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Min Price (₹)</label>
            <input
              type="number"
              placeholder="0"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Max Price (₹)</label>
            <input
              type="number"
              placeholder="No limit"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-4 mt-4">
          <button onClick={handleSearch} disabled={loading}>
            {loading ? <span className="loading"></span> : null}
            Search Properties
          </button>
          <button onClick={handleReset} className="btn-secondary">
            Reset Filters
          </button>
        </div>
      </div>

      {/* Property Results */}
      {loading ? (
        <div className="text-center" style={{ padding: '3rem' }}>
          <div className="loading" style={{ width: '40px', height: '40px', margin: '0 auto' }}></div>
          <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading properties...</p>
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center" style={{ padding: '3rem' }}>
          <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>No properties found. Try adjusting your search filters.</p>
        </div>
      ) : (
        <div className="property-grid">
          {properties.map((property) => (
            <div key={property.id} className="property-card">
              <Link to={`/property/${property.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="property-card-image">
                  <img className="property-card-img" src={getPropertyImage(property)} alt={property.title} loading="lazy" />
                  <div className="property-card-overlay" />
                  <div className="property-card-chip">{property.city}</div>
                  <div className="property-card-price">{formatINR(property.price)}</div>
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1f2937', marginBottom: '0.35rem' }}>
                    {property.title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span className="badge badge-warning">{property.type}</span>
                    <span className={`badge ${property.available ? 'badge-success' : 'badge-danger'}`}>
                      {property.available ? 'Available' : 'Occupied'}
                    </span>
                  </div>
                  <p style={{ color: '#6b7280' }}>
                    {property.address}
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}