import React, { useState } from 'react';
import './ImageSlider.css';

export default function ImageSlider({ images }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="image-slider">
        <img 
          src="https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1600&auto=format&fit=crop" 
          alt="Property" 
          className="slider-image"
        />
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (index) => {
    setCurrentImageIndex(index);
  };

  const formatImageUrl = (url) => {
    return url.startsWith('http') ? url : `http://localhost:8080${url}`;
  };

  return (
    <div className="image-slider">
      <div className="slider-container">
        <img 
          src={formatImageUrl(images[currentImageIndex])} 
          alt={`Property image ${currentImageIndex + 1}`} 
          className="slider-image"
        />
        
        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button className="slider-arrow slider-arrow-left" onClick={goToPrevious}>
              ‹
            </button>
            <button className="slider-arrow slider-arrow-right" onClick={goToNext}>
              ›
            </button>
          </>
        )}
        
        {/* Image Counter */}
        {images.length > 1 && (
          <div className="image-counter">
            {currentImageIndex + 1} / {images.length}
          </div>
        )}
      </div>
      
      {/* Thumbnail Navigation */}
      {images.length > 1 && (
        <div className="thumbnail-container">
          {images.map((image, index) => (
            <button
              key={index}
              className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
            >
              <img 
                src={formatImageUrl(image)} 
                alt={`Thumbnail ${index + 1}`}
                className="thumbnail-image"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
