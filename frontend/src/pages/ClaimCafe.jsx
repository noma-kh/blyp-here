import React, { useState } from 'react';
import { useAuth } from '../services/auth.js';
import axios from 'axios';
import ErrorState from '../components/ErrorState.jsx';

export default function ClaimCafe() {
  const { token } = useAuth();
  const [cafeId, setCafeId] = useState('');
  const [status, setStatus] = useState('idle');

  const submit = async (e) => {
    e.preventDefault();
    try {
      setStatus('loading');
      await axios.post('/api/admin/suggestions', { type: 'claim', cafe: cafeId }, { headers: { Authorization: `Bearer ${token}` } });
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <section className="space-y-6">
      <h1 className="title-xl">Claim your café</h1>
      <form onSubmit={submit} className="card p-6 space-y-3">
        <input className="border rounded px-3 py-2 w-full" placeholder="Existing Cafe ID" value={cafeId} onChange={(e)=>setCafeId(e.target.value)} />
        <button className="px-4 py-2 rounded-full bg-black text-white">Submit claim</button>
        {status === 'success' && <p className="text-green-600 text-sm">Request sent. We’ll notify you after review.</p>}
        {status === 'error' && <ErrorState message="Could not submit claim" />}
      </form>
    </section>
  );
}

