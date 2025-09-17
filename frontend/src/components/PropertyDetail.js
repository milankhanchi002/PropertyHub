import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProperty } from '../api';
import VisitForm from './VisitForm';
import LeaseForm from './LeaseForm';

export default function PropertyDetail() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [showLeaseForm, setShowLeaseForm] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  function getPropertyImage(p = {}) {
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
      } catch (err) {
        console.error("Error fetching property:", err);
        setError("Failed to load property details.");
      } finally {
        setLoading(false);
      }
    }
    fetchProperty();
  }, [id]);

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

      {/* Hero Image */}
      <div className="hero-image">
        <img src={getPropertyImage(property)} alt={property.title} />
        <div className="overlay" />
        <div className="hero-text">
          <div className="badge badge-info" style={{ marginBottom: '0.5rem' }}>{property.city}</div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>{property.title}</h1>
          <div style={{ marginTop: '0.25rem', fontWeight: '800' }}>${property.price?.toLocaleString()}</div>
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
              ${property.price?.toLocaleString()}
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#374151', marginBottom: '1rem' }}>
              Description
            </h3>
            <p style={{ color: '#4b5563', lineHeight: '1.6' }}>
              {property.description}
            </p>
          </div>

          {(property.ownerName || property.ownerEmail) && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#374151', marginBottom: '1rem' }}>
                Property Owner
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ 
                  width: '50px', 
                  height: '50px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '600'
                }}>
                  {property.ownerName?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight: '600', color: '#1f2937' }}>{property.ownerName}</p>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{property.ownerEmail}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {user && property.available && (
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
    </div>
  );
}
