import React from 'react';

export default function OwnerDashboard() {
  return (
    <section className="space-y-6">
      <div className="card overflow-hidden">
        <div className="h-40 bg-gray-100"></div>
        <div className="p-6 text-center">
          <h1 className="title-xl">BRUCO COFFEE HOUSE</h1>
          <p className="body-base text-gray-600">Welcome back! Here is your overview.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4">
          <p className="text-sm font-medium">PROFILE COMPLETION</p>
          <div className="mt-4 h-2 bg-gray-100 rounded-full">
            <div className="h-2 bg-green-500 rounded-full w-4/5" />
          </div>
        </div>
        <div className="card p-4">
          <p className="text-sm font-medium">AVERAGE RATING</p>
          <p className="mt-4 text-3xl">4.7<span className="text-base">/5</span></p>
        </div>
      </div>
    </section>
  );
}

