import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProperty, updateProperty, uploadPropertyImages } from '../api';
import VisitForm from './VisitForm';
import LeaseForm from './LeaseForm';

export default function PropertyDetail() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [showLeaseForm, setShowLeaseForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editForm, setEditForm] = useState({ price: '', address: '', city: '' });
  const [newImages, setNewImages] = useState([]);
  const [saving, setSaving] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const formatINR = (value) => {
    if (value === null || value === undefined) return '₹0';
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
    } catch {
      return `₹${Number(value).toLocaleString('en-IN')}`;
    }
  };

  function getPropertyImage(p = {}) {
    if (p && Array.isArray(p.imageUrls) && p.imageUrls.length > 0) {
      const url = p.imageUrls[0];
      return url.startsWith('http') ? url : `http://localhost:8080${url}`;
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
    async function fetchProperty() {
      try {
        const data = await getProperty(id);
        setProperty(data);
        setEditForm({
          price: data?.price ?? '',
          address: data?.address ?? '',
          city: data?.city ?? ''
        });
      } catch (err) {
        console.error("Error fetching property:", err);
        setError("Failed to load property details.");
      } finally {
        setLoading(false);
      }
    }
    fetchProperty();
  }, [id]);

  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  }

  function handleImagesChange(e) {
    const files = Array.from(e.target.files || []);
    setNewImages(files);
  }

  async function handleSaveEdits(e) {
    e.preventDefault();
    if (!property) return;
    setSaving(true);
    setError('');
    try {
      const merged = {
        // keep existing immutable/other fields
        id: property.id,
        title: property.title,
        description: property.description,
        type: property.type,
        available: property.available,
        imageUrls: property.imageUrls,
        // apply edits
        price: Number(editForm.price),
        address: editForm.address,
        city: editForm.city
      };

      await updateProperty(property.id, merged);

      if (newImages && newImages.length > 0) {
        await uploadPropertyImages(property.id, newImages);
      }

      const refreshed = await getProperty(property.id);
      setProperty(refreshed);
      setShowEditForm(false);
      setNewImages([]);
    } catch (err) {
      console.error('Failed to save edits:', err);
      setError(err?.message || 'Failed to update property');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="content">
        <div className="text-center" style={{ padding: '4rem' }}>
          <div className="loading" style={{ width: '40px', height: '40px', margin: '0 auto' }}></div>
          <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading property details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content">
        <div className="text-center" style={{ padding: '4rem' }}>
          <p style={{ color: '#ef4444', fontSize: '1.125rem' }}>{error}</p>
          <Link to="/" className="btn" style={{ marginTop: '1rem' }}>Back to Properties</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/" style={{ color: '#667eea', textDecoration: 'none', fontWeight: '500' }}>
          ← Back to Properties
        </Link>
      </div>

      {/* Hero Image (first uploaded image if available) */}
      <div className="hero-image">
        <img src={getPropertyImage(property)} alt={property.title} />
        <div className="overlay" />
        <div className="hero-text">
          <div className="badge badge-info" style={{ marginBottom: '0.5rem' }}>{property.city}</div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>{property.title}</h1>
          <div style={{ marginTop: '0.25rem', fontWeight: '800' }}>{formatINR(property.price)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        {/* Property Details */}
        <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#1f2937', marginBottom: '1rem' }}>
              {property.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <span className="badge badge-info">{property.city}</span>
              <span className="badge badge-warning">{property.type}</span>
              <span className={`badge ${property.available ? 'badge-success' : 'badge-danger'}`}>
                {property.available ? 'Available' : 'Occupied'}
              </span>
            </div>
            <p style={{ color: '#6b7280', fontSize: '1.125rem', marginBottom: '1rem' }}>
              📍 {property.address}
            </p>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#667eea' }}>
              {formatINR(property.price)}
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#374151', marginBottom: '1rem' }}>Description</h3>
            <p style={{ color: '#4b5563', lineHeight: '1.6' }}>
              {property.description}
            </p>
          </div>

        {/* Image Gallery */}
        {Array.isArray(property.imageUrls) && property.imageUrls.length > 1 && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#374151', marginBottom: '1rem' }}>More Photos</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
              {property.imageUrls.slice(1).map((u, idx) => {
                const url = u.startsWith('http') ? u : `http://localhost:8080${u}`;
                return (
                  <img
                    key={idx}
                    src={url}
                    alt={`Property image ${idx + 2}`}
                    style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '0.5rem' }}
                    loading="lazy"
                  />
                );
              })}
            </div>
          </div>
        )}

          {/* Action Buttons */
          }
          {user && property.available && (
            (() => {
              const isOwnerOfThisProperty = user.role === 'OWNER' && property.ownerEmail && user.email === property.ownerEmail;
              if (isOwnerOfThisProperty) {
                return (
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button 
                      onClick={() => setShowEditForm(true)}
                      className="btn-secondary"
                    >
                      ✏️ Edit Property
                    </button>
                  </div>
                );
              }
              return (
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => setShowVisitForm(true)}
                    className="btn"
                  >
                    📅 Schedule Visit
                  </button>
                  {user.role === 'TENANT' && (
                    <button 
                      onClick={() => setShowLeaseForm(true)}
                      className="btn-success"
                    >
                      📋 Apply for Lease
                    </button>
                  )}
                </div>
              );
            })()
          )}
        </div>
      </div>

      {/* Visit Form Modal */}
      {showVisitForm && (
        <div className="modal-overlay" onClick={() => setShowVisitForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Schedule a Visit</h3>
              <button 
                onClick={() => setShowVisitForm(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            <VisitForm 
              propertyId={property.id} 
              onSuccess={() => setShowVisitForm(false)}
            />
          </div>
        </div>
      )}

      {/* Lease Form Modal */}
      {showLeaseForm && (
        <div className="modal-overlay" onClick={() => setShowLeaseForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Apply for Lease</h3>
              <button 
                onClick={() => setShowLeaseForm(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            <LeaseForm 
              propertyId={property.id} 
              onSuccess={() => setShowLeaseForm(false)}
            />
          </div>
        </div>
      )}

      {/* Edit Property Modal (Owner) */}
      {showEditForm && (
        <div className="modal-overlay" onClick={() => setShowEditForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Edit Property</h3>
              <button 
                onClick={() => setShowEditForm(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

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

            <form onSubmit={handleSaveEdits}>
              <div className="form-group">
                <label className="form-label">Price (INR)</label>
                <input
                  type="number"
                  name="price"
                  value={editForm.price}
                  onChange={handleEditChange}
                  min="0"
                  step="1"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  name="city"
                  value={editForm.city}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  name="address"
                  value={editForm.address}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Upload New Photos</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagesChange}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setShowEditForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
