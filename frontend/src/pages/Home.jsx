import React, { useEffect, useState } from 'react';
import { listCafes } from '../services/api.js';
import CafeCard from '../components/CafeCard.jsx';
import Map from '../components/Map.jsx';

export default function Home() {
  const [cafes, setCafes] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => { fetchTop(); }, []);

  const fetchTop = async () => {
    const { cafes } = await listCafes({ minRating: 4 });
    setCafes(cafes);
  };

  const onSearch = async (e) => {
    e.preventDefault();
    const { cafes } = await listCafes({ q: query });
    setCafes(cafes);
  };

  return (
    <section className="space-y-10">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold">What is coffee for YOU?</h1>
        <p className="text-gray-600">For us, coffee is a community.</p>
        <form onSubmit={onSearch} className="mt-4 flex items-center gap-2 max-w-xl mx-auto">
          <input
            className="border rounded-full px-4 py-2 flex-1"
            placeholder="study spots in Ulaanbaatar..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="px-4 py-2 rounded-full bg-black text-white">Search</button>
        </form>
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-xl font-semibold">Top rated</h2>
          <a className="text-sm text-gray-600" href="/cafes">View all coffeeshops</a>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cafes.slice(0,8).map((c) => <CafeCard key={c._id} cafe={c} />)}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Places near you</h2>
        <Map />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4">
          <p className="text-sm font-medium">DISCOUNT</p>
          <h3 className="font-semibold mt-2">Helt (Finals) week | Student discount</h3>
          <p className="text-3xl mt-4">25% <span className="text-base">OFF</span></p>
        </div>
        <div className="card p-4">
          <p className="text-sm font-medium">CAMPAIGN</p>
          <h3 className="font-semibold mt-2">Local Artist Spotlight</h3>
          <p className="text-3xl mt-4">15% <span className="text-base">OFF</span> Art purchases</p>
        </div>
      </div>

      <div className="text-center py-8">
        <h3 className="text-xl font-semibold mb-3">Cup of coffee?</h3>
        <button className="px-4 py-2 rounded-full bg-black text-white">INVITE FRIENDS</button>
      </div>
    </section>
  );
}

