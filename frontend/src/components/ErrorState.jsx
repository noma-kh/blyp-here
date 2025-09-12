import React from 'react';

export default function ErrorState({ message = 'Something went wrong', retry }) {
  return (
    <div className="text-center py-10">
      <div className="mx-auto w-40 h-40 mb-4">
        <img src="/assets/error.png" alt="error" className="w-full h-full object-contain opacity-80" />
      </div>
      <h3 className="font-medium">{message}</h3>
      {retry && (
        <button onClick={retry} className="mt-4 px-4 py-2 rounded-full border">Try again</button>
      )}
    </div>
  );
}

