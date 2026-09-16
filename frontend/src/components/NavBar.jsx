import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-semibold text-gray-900">
          Joineazy Desk
        </Link>
        {user && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">
              {user.name} · {user.role === 'admin' ? 'Professor' : 'Student'}
            </span>
            <button
              onClick={handleLogout}
              className="rounded-full border border-gray-300 px-4 py-1.5 hover:border-red-400 hover:text-red-500 transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}