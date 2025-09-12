import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getCafe, createReview } from '../services/api.js';
import { useAuth } from '../services/auth.js';
import Map from '../components/Map.jsx';

export default function CafeDetail() {
  const { id } = useParams();
  const [cafe, setCafe] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const { user, token } = useAuth();

  useEffect(() => {
    (async () => {
      const { cafe, reviews } = await getCafe(id);
      setCafe(cafe);
      setReviews(reviews);
    })();
  }, [id]);

  const submitReview = async (e) => {
    e.preventDefault();
    if (!token) return;
    const res = await createReview({ cafeId: id, rating, comment }, token);
    setReviews((r) => [res.review, ...r]);
    setComment('');
    setRating(5);
  };

  if (!cafe) return <div>Loading…</div>;

  return (
    <section className="space-y-8">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card overflow-hidden">
          <div className="aspect-video bg-gray-100">
            {cafe.images?.[0] && <img src={cafe.images[0]} alt={cafe.name} className="w-full h-full object-cover" />}
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{cafe.name}</h1>
          <p className="text-gray-600 mt-2">{cafe.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {cafe.tags?.map((t) => (
              <span key={t} className="text-xs bg-gray-100 px-2 py-1 rounded-full">{t}</span>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-3">{cafe.location?.address} · {cafe.location?.city}</p>
        </div>
      </div>

      <div>
        <h2 className="font-semibold mb-2">Location</h2>
        <Map />
      </div>

      <div className="card p-4">
        <h2 className="font-semibold mb-3">Reviews ({reviews.length})</h2>
        {user && (
          <form onSubmit={submitReview} className="mb-4 flex gap-2">
            <select className="border rounded px-2" value={rating} onChange={(e)=>setRating(Number(e.target.value))}>
              {[1,2,3,4,5].map((n)=> <option key={n} value={n}>{n}</option>)}
            </select>
            <input className="border rounded px-3 py-2 flex-1" value={comment} onChange={(e)=>setComment(e.target.value)} placeholder="Share your experience" />
            <button className="px-3 py-2 bg-black text-white rounded">Publish</button>
          </form>
        )}
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r._id} className="border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{r.user?.name ?? 'Anon'}</span>
                <span className="text-sm text-yellow-600">{r.rating}★</span>
              </div>
              {r.comment && <p className="text-sm mt-1">{r.comment}</p>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

