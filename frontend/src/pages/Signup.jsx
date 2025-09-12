import React, { useState } from 'react';
import { useAuth } from '../services/auth.js';
import { useNavigate } from 'react-router-dom';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const ok = await signup(name, email, password);
    if (ok) navigate('/profile');
  };

  return (
    <form onSubmit={submit} className="max-w-sm mx-auto card p-6 space-y-3">
      <h1 className="text-lg font-semibold">Create account</h1>
      <input className="border rounded px-3 py-2 w-full" placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)} />
      <input className="border rounded px-3 py-2 w-full" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
      <input className="border rounded px-3 py-2 w-full" type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} />
      <button className="w-full bg-black text-white py-2 rounded">Sign up</button>
    </form>
  );
}

