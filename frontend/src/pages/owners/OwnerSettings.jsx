import React from 'react';

export default function OwnerSettings() {
  return (
    <section className="space-y-6">
      <div className="card overflow-hidden">
        <div className="h-40 bg-gray-100"></div>
        <div className="p-6 text-center">
          <h1 className="title-xl">Settings</h1>
          <p className="body-base text-gray-600">Manage your business info and team.</p>
        </div>
      </div>

      <div className="card p-4">
        <p className="font-medium mb-3">Social Media Links</p>
        <div className="space-y-2">
          <input className="border rounded px-3 py-2 w-full" placeholder="Website" />
          <input className="border rounded px-3 py-2 w-full" placeholder="Facebook" />
          <input className="border rounded px-3 py-2 w-full" placeholder="Instagram" />
        </div>
        <button className="mt-4 px-4 py-2 rounded-full bg-black text-white">Save Links</button>
      </div>
    </section>
  );
}

