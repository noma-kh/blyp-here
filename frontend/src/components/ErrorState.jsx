import React from 'react';

export default function ErrorState({ message = 'Something went wrong', retry }) {
  return (
    <div className="text-center py-10">
      <div className="mx-auto w-40 h-40 mb-4">
        <img
          src="/assets/error.png"
          alt="error"
          className="w-full h-full object-contain opacity-80"
          onError={(e)=>{ e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'160\' height=\'160\'><rect width=\'100%\' height=\'100%\' fill=\'%23fef2f2\'/><text x=\'50%\' y=\'50%\' dominant-baseline=\'middle\' text-anchor=\'middle\' font-size=\'14\' fill=\'%23ef4444\'>Error</text></svg>'; }}
        />
      </div>
      <h3 className="font-medium">{message}</h3>
      {retry && (
        <button onClick={retry} className="mt-4 px-4 py-2 rounded-full border">Try again</button>
      )}
    </div>
  );
}

