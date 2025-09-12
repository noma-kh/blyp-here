import React from 'react';

export default function EmptyState({ title = 'Nothing here yet', subtitle, action }) {
  return (
    <div className="text-center py-10">
      <div className="mx-auto w-40 h-40 mb-4">
        <img
          src="/assets/empty.png"
          alt="empty"
          className="w-full h-full object-contain opacity-80"
          onError={(e)=>{ e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'160\' height=\'160\'><rect width=\'100%\' height=\'100%\' fill=\'%23f1f5f9\'/><text x=\'50%\' y=\'50%\' dominant-baseline=\'middle\' text-anchor=\'middle\' font-size=\'14\' fill=\'%239ca3af\'>Empty</text></svg>'; }}
        />
      </div>
      <h3 className="font-medium">{title}</h3>
      {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

