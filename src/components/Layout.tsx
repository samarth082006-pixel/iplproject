import { useState } from 'react';
import {
  Activity, LayoutDashboard, Dumbbell, Apple, Target, TrendingUp,
  LogOut, Menu, X, User, ChevronRight, Brain, Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/supabase';

type Page = 'dashboard' | 'workouts' | 'nutrition' | 'goals' | 'progress' | 'profile' | 'ai';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  profile: Profile | null;
}

const navItems: { id: Page; label: string; icon: React.ElementType; badge?: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'workouts', label: 'Workouts', icon: Dumbbell },
  { id: 'nutrition', label: 'Nutrition', icon: Apple },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
];

export default function Layout({ children, currentPage, onNavigate, profile }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const displayName = profile?.full_name || profile?.username || 'Athlete';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1e] via-[#111827] to-[#0f172a] flex">
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-950/80 backdrop-blur-xl border-r border-slate-800/60 flex flex-col
        transform transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:flex
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800/60">
          <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Activity size={20} className="text-white" />
          </div>
          <div>
            <div className="text-base font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
              FitFuel
            </div>
            <div className="text-xs text-blue-400 font-medium flex items-center gap-1">
              <Sparkles size={8} /> AI-Powered
            </div>
          </div>
        </div>

        {/* AI Button */}
        <div className="px-3 py-3">
          <button
            onClick={() => { onNavigate('ai'); setMobileOpen(false); }}
            className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${
              currentPage === 'ai'
                ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-blue-600/40'
                : 'bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-600/20 hover:border-blue-600/40'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Brain size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">AI Features</div>
              <div className="text-xs text-slate-400">7 ML models</div>
            </div>
            <span className="badge-ai text-xs">NEW</span>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 mb-2">Menu</div>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { onNavigate(id); setMobileOpen(false); }}
              className={`w-full ${currentPage === id ? 'nav-item-active' : 'nav-item'}`}
            >
              <Icon size={18} />
              <span className="flex-1 text-left">{label}</span>
              {currentPage === id && <ChevronRight size={14} className="text-blue-400 opacity-70" />}
            </button>
          ))}
        </nav>

        {/* Profile / Logout */}
        <div className="px-3 py-4 border-t border-slate-800/60 space-y-1">
          <button
            onClick={() => { onNavigate('profile'); setMobileOpen(false); }}
            className={`w-full ${currentPage === 'profile' ? 'nav-item-active' : 'nav-item'}`}
          >
            <div className="w-7 h-7 bg-blue-600/30 rounded-lg flex items-center justify-center text-xs font-bold text-blue-300 flex-shrink-0">
              {initials}
            </div>
            <span className="flex-1 text-left truncate">{displayName}</span>
            <User size={14} className="opacity-50" />
          </button>
          <button
            onClick={() => supabase.auth.signOut()}
            className="nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-900/20"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 modal-backdrop lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3.5 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/60 sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
              <Activity size={16} className="text-white" />
            </div>
            <span className="text-sm font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>FitFuel</span>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6 xl:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
