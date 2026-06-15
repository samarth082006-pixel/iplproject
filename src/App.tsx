import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import type { Profile } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';
import AuthPage from './components/AuthPage';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Workouts from './pages/Workouts';
import Nutrition from './pages/Nutrition';
import Goals from './pages/Goals';
import Progress from './pages/Progress';
import ProfilePage from './pages/Profile';
import AIDashboard from './pages/AIDashboard';

type Page = 'dashboard' | 'workouts' | 'nutrition' | 'goals' | 'progress' | 'profile' | 'ai';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [page, setPage] = useState<Page>('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        setSession(session);
        if (session) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      setProfile(data as Profile);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const newProfile = {
          id: userId,
          full_name: user.user_metadata?.full_name || null,
          username: null,
          avatar_url: null,
          height_cm: null,
          weight_kg: null,
          date_of_birth: null,
          fitness_level: 'beginner',
          primary_goal: 'general_fitness',
        };
        const { data: created } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();
        if (created) setProfile(created as Profile);
      }
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0f1e] via-[#111827] to-[#0f172a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center pulse-glow">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
          <p className="text-slate-400 text-sm">Loading FitFuel AI...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  const userId = session.user.id;

  function renderPage() {
    switch (page) {
      case 'dashboard':
        return <Dashboard userId={userId} onNavigate={setPage} />;
      case 'workouts':
        return <Workouts userId={userId} />;
      case 'nutrition':
        return <Nutrition userId={userId} />;
      case 'goals':
        return <Goals userId={userId} />;
      case 'progress':
        return <Progress userId={userId} />;
      case 'profile':
        return <ProfilePage userId={userId} profile={profile} onProfileUpdate={setProfile} />;
      case 'ai':
        return <AIDashboard userId={userId} />;
      default:
        return <Dashboard userId={userId} onNavigate={setPage} />;
    }
  }

  return (
    <Layout currentPage={page} onNavigate={setPage} profile={profile}>
      {renderPage()}
    </Layout>
  );
}
