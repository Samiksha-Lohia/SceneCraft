import React, { useState } from 'react';
import { api } from '../services/api';
import { X, Loader2} from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await api.auth.login(email, password);
      } else {
        await api.auth.register(name, email, password);
      }
      onAuthSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
    <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden p-7 flex flex-col">
    {/* Close Button */}
    <button
      onClick={onClose}
      className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all"
    >
      <X className="w-4 h-4" />
    </button>

    {/* Header */}
    <div className="mb-5 text-center">
      <h2 className="text-2xl font-serif font-semibold text-slate-900 mb-1">
        {isLogin ? 'Welcome back' : 'Create an account'}
      </h2>

      <p className="text-sm text-slate-500">
        {isLogin
          ? 'Sign in to access your story notebooks'
          : 'Get started to analyze your novels'}
      </p>
    </div>

    {/* Error */}
    {error && (
      <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
        {error}
      </div>
    )}

    {/* Auth Form */}
    <form onSubmit={handleSubmit} className="space-y-4">

      {!isLogin && (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Name
          </label>

          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="George R. R. Martin"
            className="w-full h-11 px-4 border border-slate-200 rounded-xl bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
          />
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
          Email
        </label>

        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="writer@scenecraft.ai"
          className="w-full h-11 px-4 border border-slate-200 rounded-xl bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
          Password
        </label>

        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full h-11 px-4 border border-slate-200 rounded-xl bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
        />
      </div>

      {/* Main Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full h-11 mt-2 bg-purple-200 hover:bg-purple-300 text-slate-900 border border-slate-900 rounded-xl text-sm font-semibold shadow-[3px_3px_0px_#0f172a] hover:shadow-[4px_4px_0px_#0f172a] hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {isLogin ? 'Sign In' : 'Sign Up'}
      </button>
    </form>

    {/* Toggle Mode */}
    <div className="mt-5 text-center text-sm text-slate-500">
      {isLogin
        ? "Don't have an account? "
        : "Already have an account? "}

      <button
        type="button"
        onClick={() => {
          setIsLogin(!isLogin);
          setError('');
        }}
        className="text-slate-950 font-semibold hover:underline underline-offset-4 transition-all"
      >
        {isLogin ? 'Sign up' : 'Sign in'}
      </button>
    </div>
  </div>
  </div>
  );
}
