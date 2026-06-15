import { useState } from 'react';
import { Activity, Dumbbell, Flame, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (mode === 'signup') {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (signUpError) setError(signUpError.message);
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) setError(signInError.message);
    }
    setLoading(false);
  }

  const features = [
    { icon: Dumbbell, label: 'Workout Tracking', desc: 'Log sets, reps & weights' },
    { icon: Flame, label: 'Nutrition Logging', desc: 'Track macros & calories' },
    { icon: TrendingUp, label: 'Progress Charts', desc: 'Visualize your gains' },
    { icon: Activity, label: 'Goal Setting', desc: 'Set & crush your goals' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex">
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 bg-gradient-to-br from-slate-900 to-[#0a0f1e] border-r border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Activity size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            FitTracker Pro
          </span>
        </div>

        <div>
          <h1 className="text-5xl font-bold text-white leading-tight mb-6" style={{ fontFamily: 'Syne, sans-serif' }}>
            Train smarter,<br />
            <span className="text-gradient">not harder.</span>
          </h1>
          <p className="text-slate-400 text-lg mb-12 leading-relaxed">
            The all-in-one fitness platform to track workouts, monitor nutrition, and achieve your goals.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="card p-4 flex gap-3">
                <div className="w-9 h-9 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-blue-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>50K+</div>
            <div className="text-xs text-slate-500 mt-0.5">Active Users</div>
          </div>
          <div className="w-px h-8 bg-slate-800" />
          <div className="text-center">
            <div className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>2M+</div>
            <div className="text-xs text-slate-500 mt-0.5">Workouts Logged</div>
          </div>
          <div className="w-px h-8 bg-slate-800" />
          <div className="text-center">
            <div className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>98%</div>
            <div className="text-xs text-slate-500 mt-0.5">User Satisfaction</div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Activity size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
              FitTracker Pro
            </span>
          </div>

          <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
            {mode === 'login' ? 'Welcome back' : 'Get started'}
          </h2>
          <p className="text-slate-400 mb-8">
            {mode === 'login'
              ? 'Sign in to continue your fitness journey'
              : 'Create your free account today'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="input"
                  required
                />
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-800/50 text-red-400 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center flex mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
