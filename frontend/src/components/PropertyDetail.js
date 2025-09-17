import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProperty } from '../api';
import VisitForm from './VisitForm';
import LoadingSpinner from './LoadingSpinner'; // This import now works correctly

export default function PropertyDetail() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProperty() {
      setLoading(true);
      setError(null);
      try {
        const data = await getProperty(id);
        setProperty(data);
      } catch (err) {
        console.error("Error fetching property:", err);
        setError("Failed to load property details. It may have been removed or the link is incorrect.");
      } finally {
        setLoading(false);
      }
    }
    fetchProperty();
  }, [id]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!property) {
    return null;
  }

  return (
    <div className="property-detail-page">
      <div className="detail-layout-grid">
        {/* Left Column: Property Information */}
        <div className="property-info-panel">
          <h1 className="property-title">{property.title}</h1>
          <p className="property-address">{property.address}, {property.city}</p>

          <div className="key-details">
            <div className="detail-item">
              <span className="detail-label">Price</span>
              <span className="detail-value price">${property.price.toLocaleString()}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Type</span>
              <span className="detail-value">{property.type}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Status</span>
              <span className={`status-badge ${property.available ? 'status-available' : 'status-occupied'}`}>
                {property.available ? 'Available' : 'Occupied'}
              </span>
            </div>
          </div>

          <h2 className="section-title">About this property</h2>
          <p className="property-description">{property.description}</p>
        </div>

        {/* Right Column: Visit Form */}
        <div className="visit-form-panel">
          <VisitForm propertyId={property.id} />
        </div>
      </div>
    </div>
  );
}

// ✅ The duplicate function definition has been REMOVED from here.