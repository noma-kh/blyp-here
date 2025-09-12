import React, { useEffect, useState } from 'react';
import { useAuth } from '../services/auth.js';
import { getProfile } from '../services/api.js';

export default function Profile() {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState('saved');

  useEffect(() => {
    (async () => {
      if (!token) return;
      const data = await getProfile(token);
      setProfile(data.user);
    })();
  }, [token]);

  if (!token) return <div className="text-center">Please log in to view your profile.</div>;
  if (!profile) return <div>Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="card overflow-hidden">
        <div className="h-40 bg-gray-100">
          {user?.avatarUrl && <img className="w-full h-full object-cover" src={user.avatarUrl} />}
        </div>
        <div className="-mt-10 px-6 pb-6">
          <div className="w-20 h-20 rounded-full bg-white border -mb-2" />
          <h1 className="text-xl font-semibold mt-4">{profile.name}</h1>
          <p className="text-sm text-gray-600">Songwriter. Obsessed with oat milk matcha.</p>
        </div>
      </div>

      <div className="border-b flex gap-6">
        {['saved','submissions','badges'].map((k)=> (
          <button key={k} onClick={()=>setTab(k)} className={`py-2 ${tab===k? 'border-b-2 border-black font-medium':''}`}>{k === 'saved' ? 'Saved' : k === 'submissions' ? 'My Submissions' : 'Badges'}</button>
        ))}
      </div>

      <div>
        {tab === 'saved' && <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"><div className="card h-40" /><div className="card h-40" /><div className="card h-40" /></div>}
        {tab === 'submissions' && <div className="card p-4">No submissions yet.</div>}
        {tab === 'badges' && <div className="card p-4">Recent Achievements placeholder.</div>}
      </div>
    </div>
  );
}

