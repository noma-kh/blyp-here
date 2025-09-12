import React, { useState } from 'react';
import { useAuth } from '../services/auth.js';
import axios from 'axios';

export default function SuggestCafe() {
  const { token } = useAuth();
  const [state, setState] = useState({ name: '', description: '', address: '', city: '', country: '' });
  const [status, setStatus] = useState('idle');

  const submit = async (e) => {
    e.preventDefault();
    try {
      setStatus('loading');
      await axios.post('/api/admin/suggestions', {
        type: 'suggest',
        name: state.name,
        description: state.description,
        location: { address: state.address, city: state.city, country: state.country }
      }, { headers: { Authorization: `Bearer ${token}` } });
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <section className="space-y-6">
      <h1 className="title-xl">Suggest a new café</h1>
      <form onSubmit={submit} className="card p-6 space-y-3">
        <input className="border rounded px-3 py-2 w-full" placeholder="Name" value={state.name} onChange={(e)=>setState({...state,name:e.target.value})} />
        <textarea className="border rounded px-3 py-2 w-full" placeholder="Description" value={state.description} onChange={(e)=>setState({...state,description:e.target.value})} />
        <div className="grid sm:grid-cols-3 gap-3">
          <input className="border rounded px-3 py-2" placeholder="Address" value={state.address} onChange={(e)=>setState({...state,address:e.target.value})} />
          <input className="border rounded px-3 py-2" placeholder="City" value={state.city} onChange={(e)=>setState({...state,city:e.target.value})} />
          <input className="border rounded px-3 py-2" placeholder="Country" value={state.country} onChange={(e)=>setState({...state,country:e.target.value})} />
        </div>
        <button className="px-4 py-2 rounded-full bg-black text-white">Submit</button>
        {status === 'success' && <p className="text-green-600 text-sm">Thanks! We’ll review your suggestion.</p>}
        {status === 'error' && <p className="text-red-600 text-sm">Something went wrong. Please try again.</p>}
      </form>
    </section>
  );
}

