import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProperty } from '../api';
import VisitForm from './VisitForm';

export default function PropertyDetail() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);

  useEffect(() => {
    async function fetchProperty() {
      try {
        const data = await getProperty(id);
        setProperty(data);
      } catch (err) {
        console.error("Error fetching property:", err);
        alert("Failed to load property details.");
      }
    }
    fetchProperty();
  }, [id]);

  if (!property) return <div>Loading...</div>;

  return (
    <div>
      <h2>{property.title}</h2>
      <p>{property.description}</p>
      <p>{property.address}, {property.city}</p>
      <p>{property.type} — {property.price}</p>

      <h3>Book a Visit</h3>
      <VisitForm propertyId={property.id} />
    </div>
  );
}
