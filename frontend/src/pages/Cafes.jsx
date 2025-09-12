import React, { useEffect, useState } from 'react';
import { listCafes } from '../services/api.js';
import CafeCard from '../components/CafeCard.jsx';

export default function Cafes() {
  const [cafes, setCafes] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { cafes } = await listCafes();
    setCafes(cafes);
  };

  const onSearch = async (e) => {
    e.preventDefault();
    const { cafes } = await listCafes({ q: query });
    setCafes(cafes);
  };

  return (
    <section className="grid grid-cols-12 gap-6">
      <aside className="hidden md:block md:col-span-3">
        <div className="card p-4 sticky top-24">
          <p className="font-semibold mb-3">Hide filters</p>
          <div className="space-y-2 text-sm text-gray-700">
            <p className="font-medium">Purpose</p>
            {['Study-friendly','Chill & Social','Work friendly','Outdoor seating'].map((v)=>(
              <label key={v} className="flex items-center gap-2"><input type="checkbox"/> {v}</label>
            ))}
          </div>
        </div>
      </aside>
      <div className="col-span-12 md:col-span-9">
        <form onSubmit={onSearch} className="mb-4 flex gap-2">
          <input className="border rounded-full px-4 py-2 flex-1" placeholder="perfect for slow mornings..." value={query} onChange={(e)=>setQuery(e.target.value)} />
          <button className="px-4 py-2 rounded-full bg-black text-white">Search</button>
        </form>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cafes.map((c) => <CafeCard key={c._id} cafe={c} />)}
        </div>
      </div>
    </section>
  );
}

