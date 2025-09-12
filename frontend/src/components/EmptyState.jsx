import React from 'react';

export default function EmptyState({ title = 'Nothing here yet', subtitle, action }) {
  return (
    <div className="text-center py-10">
      <div className="mx-auto w-40 h-40 mb-4">
        <img src="/assets/empty.png" alt="empty" className="w-full h-full object-contain opacity-80" />
      </div>
      <h3 className="font-medium">{title}</h3>
      {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

