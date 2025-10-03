import React from "react";

const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-black">
    <div className="w-full max-w-md mx-auto py-8 px-8 rounded-xl shadow-2xl bg-white/10 backdrop-blur-lg border border-white/20 flex flex-col items-center">
      <h1 className="text-4xl font-bold text-white mb-4">404</h1>
      <p className="text-lg text-white/80 mb-6">Page Not Found</p>
    </div>
  </div>
);

export default NotFound;
