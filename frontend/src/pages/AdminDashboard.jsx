import React, { useEffect, useState } from 'react';
import { useAuth } from '../services/auth.js';
import axios from 'axios';

export default function AdminDashboard() {
  const { token } = useAuth();
  const [tab, setTab] = useState('pending');
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => { fetchItems(); }, [tab]);

  const fetchItems = async () => {
    try {
      setError('');
      const { data } = await axios.get('/api/admin/suggestions', { params: { status: tab }, headers: { Authorization: `Bearer ${token}` } });
      setItems(data.items);
    } catch (e) {
      setError('Failed to load.');
    }
  };

  const act = async (id, action) => {
    const url = `/api/admin/suggestions/${id}/${action}`;
    await axios.post(url, {}, { headers: { Authorization: `Bearer ${token}` } });
    fetchItems();
  };

  return (
    <section className="space-y-6">
      <h1 className="title-xl">Coffee Shop Admin</h1>
      <div className="flex gap-6 border-b">
        {['pending','approved','rejected'].map((k)=> (
          <button key={k} onClick={()=>setTab(k)} className={`py-2 ${tab===k? 'border-b-2 border-black font-medium':''}`}>{k[0].toUpperCase()+k.slice(1)}</button>
        ))}
      </div>
      {error && <div className="text-red-600">{error}</div>}
      {items.length === 0 ? (
        <div className="text-gray-600">No applications.</div>
      ) : (
        <ul className="space-y-3">
          {items.map((s)=> (
            <li key={s._id} className="card p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{s.name ?? 'Claim request'}</p>
                <p className="text-sm text-gray-600">{s.type} · {s.status}</p>
              </div>
              {tab==='pending' && (
                <div className="flex gap-2">
                  <button onClick={()=>act(s._id,'approve')} className="px-3 py-1 rounded-full bg-black text-white">Approve</button>
                  <button onClick={()=>act(s._id,'reject')} className="px-3 py-1 rounded-full border">Reject</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

