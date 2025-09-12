import React, { useEffect, useRef } from 'react';

// Insert your real Google Maps or Mapbox key where indicated below.
export default function Map({ lng = -122.401, lat = 37.793, zoom = 13 }) {
  const ref = useRef(null);

  useEffect(() => {
    // Placeholder for pixel space; swap with provider init
    // mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN_HERE'; // TODO: insert your key
    // const map = new mapboxgl.Map({ container: ref.current, ... });
    // return () => map.remove();
  }, []);

  return (
    <div className="w-full h-72 bg-gray-200 grid place-items-center rounded-xl" ref={ref}>
      <span className="text-gray-600 text-sm">Map placeholder (insert API key and init)</span>
    </div>
  );
}

