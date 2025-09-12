import React from 'react';
import { Link } from 'react-router-dom';

export default function CafeCard({ cafe }) {
  return (
    <Link to={`/cafes/${cafe._id}`} className="card block p-3 hover:shadow-md transition">
      <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden">
        {cafe.images?.[0] && (
          <img src={cafe.images[0]} alt={cafe.name} className="w-full h-full object-cover" />
        )}
      </div>
      <div className="flex items-start justify-between">
        <h3 className="font-semibold">{cafe.name}</h3>
        <span className="text-sm text-yellow-600">{cafe.ratingAvg?.toFixed(1) ?? '—'}★</span>
      </div>
      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{cafe.description}</p>
      <div className="mt-2 flex gap-2 flex-wrap">
        {cafe.tags?.slice(0,4).map((t) => (
          <span key={t} className="text-xs bg-gray-100 px-2 py-1 rounded-full">{t}</span>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-2">{cafe.location?.address} · {cafe.location?.city}</p>
    </Link>
  );
}

