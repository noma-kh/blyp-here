import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/auth.js';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="bg-white border-b">
      <div className="container h-16 flex items-center justify-between">
        <Link to="/" className="font-semibold text-lg tracking-tight">blyp-here</Link>
        <nav className="flex items-center gap-6 text-sm">
          <NavLink to="/cafes" className={({isActive})=>isActive? 'underline' : 'hover:underline'}>Explore</NavLink>
          {user ? (
            <>
              <NavLink to="/profile" className={({isActive})=>isActive? 'underline' : 'hover:underline'}>Profile</NavLink>
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="text-red-600"
              >Logout</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={({isActive})=>isActive? 'underline' : 'hover:underline'}>Login</NavLink>
              <NavLink to="/signup" className={({isActive})=>isActive? 'underline' : 'hover:underline'}>Sign up</NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

