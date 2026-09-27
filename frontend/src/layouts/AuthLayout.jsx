import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthLayout = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-600 to-brand-800 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white text-2xl font-black">LC</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          LogiCore
        </h2>
        <p className="mt-2 text-center text-sm text-brand-600 font-medium tracking-wide">
          JD-STYLE SUPPLY CHAIN &amp; E-COMMERCE SUITE
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-lg border-t-4 border-brand-600 sm:px-10">
          <Outlet />
        </div>
        <p className="mt-6 text-center text-xs text-gray-400">
          Demo platform — not affiliated with JD.com
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
