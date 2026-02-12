import React, { useState } from 'react';

interface SignInProps {
  onSignIn: (user: { name: string; email: string }) => void;
}

const SignIn: React.FC<SignInProps> = ({ onSignIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate a network request
    setTimeout(() => {
      onSignIn({ 
        name: email.split('@')[0] || 'Farm Manager', 
        email 
      });
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-transparent">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-100 border border-emerald-50 transform hover:scale-110 transition-transform duration-300">
            {/* Animated Corn SVG */}
            <svg className="w-10 h-10 animate-bounce" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 20C7 20 4 15 5 10C6 5 10 3 10 3" stroke="#10B981" strokeWidth="2" strokeLinecap="round"/>
              <path d="M17 20C17 20 20 15 19 10C18 5 14 3 14 3" stroke="#10B981" strokeWidth="2" strokeLinecap="round"/>
              <rect x="9" y="6" width="6" height="13" rx="3" fill="#FBBF24"/>
              <path d="M10 9H14M10 12H14M10 15H14" stroke="#D97706" strokeWidth="1" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-black text-slate-900 tracking-tight">
          Farm Accounting
        </h2>
        <p className="mt-2 text-center text-sm text-slate-800 font-medium">
          Sign in to manage your livestock and field ledger
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/80 backdrop-blur-md py-8 px-4 shadow-2xl shadow-slate-900/10 sm:rounded-2xl sm:px-10 border border-white/50">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all bg-white/50"
                  placeholder="manager@myfarm.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all bg-white/50"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-emerald-600 hover:text-emerald-500">
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-slate-500 font-medium">Quick Access</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => onSignIn({ name: 'Guest Farmer', email: 'guest@farmaccounting.com' })}
                className="w-full inline-flex justify-center py-3 px-4 border border-slate-300 rounded-xl shadow-sm bg-white/50 text-sm font-bold text-slate-700 hover:bg-white transition-all"
              >
                Continue as Guest
              </button>
            </div>
          </div>
        </div>
        
        <p className="mt-8 text-center text-xs text-slate-900 font-bold drop-shadow-sm">
          By signing in, you agree to our Terms of Service and Privacy Policy.
          <br />© 2025 Farm Accounting. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default SignIn;