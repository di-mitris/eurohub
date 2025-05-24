// src/components/EuropeMap.js - Improved centering and sizing
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { electionData } from '@/data/electionData';

const EuropeMap = ({ setTooltip }) => {
  const mapContainerRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    console.log('Election data loaded:', Object.keys(electionData).length, 'countries');
    
    const initializeMap = async () => {
      try {
        const response = await fetch('/europe.svg');
        if (!response.ok) {
          throw new Error('Failed to load SVG map');
        }
        
        const svgText = await response.text();
        
        if (mapContainerRef.current) {
          mapContainerRef.current.innerHTML = svgText;
          
          setTimeout(() => {
            const svgElement = mapContainerRef.current.querySelector('svg');
            if (svgElement) {
              // Improve SVG sizing and centering
              svgElement.style.width = '100%';
              svgElement.style.height = '100%';
              svgElement.style.maxWidth = '100%';
              svgElement.style.maxHeight = '100%';
              svgElement.style.objectFit = 'contain';
              
              // Set viewBox to better center European countries and balance Iceland/Armenia
              // Format: viewBox="x y width height" 
              // x,y = top-left corner position | width,height = visible area size
              svgElement.setAttribute('viewBox', '150 150 850 500');
              svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            }
            
            const countries = mapContainerRef.current.querySelectorAll('path');
            console.log('Found', countries.length, 'country paths in SVG');
            
            countries.forEach(country => {
              const countryCode = country.id?.toUpperCase();
              
              if (electionData[countryCode]) {
                console.log('Adding interactivity to:', countryCode);
                
                country.classList.add('country');
                
                // Enhanced styling
                country.style.fill = '#e3f2fd';
                country.style.stroke = '#1976d2';
                country.style.strokeWidth = '1.5';
                country.style.cursor = 'pointer';
                country.style.transition = 'all 0.2s ease';
                
                // Improved event listeners with better positioning
                country.addEventListener('mouseover', (e) => {
                  country.style.fill = '#bbdefb';
                  country.style.strokeWidth = '2.5';
                  country.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))';
                  
                  setTooltip({
                    display: true,
                    country: electionData[countryCode],
                    x: e.clientX,
                    y: e.clientY
                  });
                });
                
                country.addEventListener('mousemove', (e) => {
                  setTooltip(prev => ({
                    ...prev,
                    x: e.clientX,
                    y: e.clientY
                  }));
                });
                
                country.addEventListener('mouseleave', () => {
                  country.style.fill = '#e3f2fd';
                  country.style.strokeWidth = '1.5';
                  country.style.filter = 'none';
                  setTooltip({
                    display: false,
                    country: null,
                    x: 0,
                    y: 0
                  });
                });
              } else {
                // Style countries without election data
                country.style.fill = '#f5f5f5';
                country.style.stroke = '#bdbdbd';
                country.style.strokeWidth = '0.5';
              }
            });
            
            setMapLoaded(true);
          }, 100);
        }
      } catch (error) {
        console.error('Error loading SVG map:', error);
      }
    };
    
    initializeMap();
    
    // Clean up function
    return () => {
      if (mapContainerRef.current) {
        const countries = mapContainerRef.current.querySelectorAll('.country');
        countries.forEach(country => {
          const newCountry = country.cloneNode(true);
          country.parentNode.replaceChild(newCountry, country);
        });
      }
    };
  }, [setTooltip]);

  return (
    <div className="relative w-full h-full">
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-500 text-sm">Loading map...</p>
          </div>
        </div>
      )}
      
      <div 
        ref={mapContainerRef} 
        className="w-full h-full transition-opacity duration-500" 
        style={{ 
          opacity: mapLoaded ? 1 : 0,
          // Improved container styling
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      />
    </div>
  );
};

export default EuropeMap;