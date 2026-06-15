import { useEffect, useState } from 'react';
import { User, Save, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/supabase';

interface Props {
  userId: string;
  profile: Profile | null;
  onProfileUpdate: (p: Profile) => void;
}

const FITNESS_LEVELS = ['beginner', 'intermediate', 'advanced', 'athlete'];
const PRIMARY_GOALS = [
  { value: 'general_fitness', label: 'General Fitness' },
  { value: 'weight_loss', label: 'Weight Loss' },
  { value: 'muscle_gain', label: 'Muscle Gain' },
  { value: 'strength', label: 'Strength' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'flexibility', label: 'Flexibility' },
];

export default function ProfilePage({ userId, profile, onProfileUpdate }: Props) {
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    height_cm: '',
    weight_kg: '',
    date_of_birth: '',
    fitness_level: 'beginner',
    primary_goal: 'general_fitness',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        username: profile.username || '',
        height_cm: profile.height_cm ? String(profile.height_cm) : '',
        weight_kg: profile.weight_kg ? String(profile.weight_kg) : '',
        date_of_birth: profile.date_of_birth || '',
        fitness_level: profile.fitness_level || 'beginner',
        primary_goal: profile.primary_goal || 'general_fitness',
      });
    }
  }, [profile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const data = {
      id: userId,
      full_name: form.full_name || null,
      username: form.username || null,
      height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
      date_of_birth: form.date_of_birth || null,
      fitness_level: form.fitness_level,
      primary_goal: form.primary_goal,
      updated_at: new Date().toISOString(),
    };

    const { data: updated, error } = await supabase
      .from('profiles')
      .upsert(data)
      .select()
      .single();

    if (!error && updated) {
      onProfileUpdate(updated as Profile);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  }

  const initials = (form.full_name || form.username || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const bmi = form.height_cm && form.weight_kg
    ? (parseFloat(form.weight_kg) / Math.pow(parseFloat(form.height_cm) / 100, 2)).toFixed(1)
    : null;

  const bmiCategory = bmi
    ? Number(bmi) < 18.5 ? { label: 'Underweight', color: 'text-blue-400' }
      : Number(bmi) < 25 ? { label: 'Normal', color: 'text-emerald-400' }
      : Number(bmi) < 30 ? { label: 'Overweight', color: 'text-amber-400' }
      : { label: 'Obese', color: 'text-red-400' }
    : null;

  return (
    <div className="space-y-6 slide-up max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Profile</h1>
        <p className="text-slate-400 text-sm mt-0.5">Manage your personal information and preferences</p>
      </div>

      <div className="card p-5 flex items-center gap-5">
        <div className="w-16 h-16 bg-blue-600/20 border-2 border-blue-600/40 rounded-2xl flex items-center justify-center text-xl font-bold text-blue-300 flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1">
          <div className="text-lg font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            {form.full_name || form.username || 'Athlete'}
          </div>
          <div className="text-sm text-slate-400 capitalize mt-0.5">{form.fitness_level} · {PRIMARY_GOALS.find(g => g.value === form.primary_goal)?.label}</div>
        </div>
        {bmi && bmiCategory && (
          <div className="text-right flex-shrink-0">
            <div className={`text-xl font-bold ${bmiCategory.color}`} style={{ fontFamily: 'Syne, sans-serif' }}>{bmi}</div>
            <div className="text-xs text-slate-500">BMI · {bmiCategory.label}</div>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="card p-5 space-y-4">
          <h3 className="font-bold text-white text-sm mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>Personal Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input type="text" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} placeholder="John Doe" className="input" />
            </div>
            <div>
              <label className="label">Username</label>
              <input type="text" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} placeholder="johndoe" className="input" />
            </div>
          </div>
          <div>
            <label className="label">Date of Birth</label>
            <input type="date" value={form.date_of_birth} onChange={e => setForm(p => ({ ...p, date_of_birth: e.target.value }))} className="input max-w-56" />
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h3 className="font-bold text-white text-sm mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>Body Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Height (cm)</label>
              <input type="number" value={form.height_cm} onChange={e => setForm(p => ({ ...p, height_cm: e.target.value }))} placeholder="175" className="input" min="100" max="250" step="0.5" />
            </div>
            <div>
              <label className="label">Weight (kg)</label>
              <input type="number" value={form.weight_kg} onChange={e => setForm(p => ({ ...p, weight_kg: e.target.value }))} placeholder="75" className="input" min="30" max="300" step="0.5" />
            </div>
          </div>
          {bmi && bmiCategory && (
            <div className="bg-slate-800/50 rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500">Body Mass Index</div>
                <div className={`text-lg font-bold ${bmiCategory.color}`} style={{ fontFamily: 'Syne, sans-serif' }}>{bmi}</div>
              </div>
              <div className={`badge ${
                bmiCategory.label === 'Normal' ? 'bg-emerald-600/20 text-emerald-400'
                : bmiCategory.label === 'Underweight' ? 'bg-blue-600/20 text-blue-400'
                : bmiCategory.label === 'Overweight' ? 'bg-amber-600/20 text-amber-400'
                : 'bg-red-600/20 text-red-400'
              }`}>{bmiCategory.label}</div>
            </div>
          )}
        </div>

        <div className="card p-5 space-y-4">
          <h3 className="font-bold text-white text-sm mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>Fitness Preferences</h3>
          <div>
            <label className="label">Fitness Level</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FITNESS_LEVELS.map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, fitness_level: level }))}
                  className={`py-2 rounded-xl text-sm font-medium capitalize border transition-all ${
                    form.fitness_level === level
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Primary Goal</label>
            <div className="grid grid-cols-2 gap-2">
              {PRIMARY_GOALS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, primary_goal: value }))}
                  className={`py-2.5 px-3 rounded-xl text-sm font-medium text-left border transition-all ${
                    form.primary_goal === value
                      ? 'bg-blue-600/10 border-blue-600 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
            ) : saved ? (
              <><Save size={15} /> Saved!</>
            ) : (
              <><Save size={15} /> Save Profile</>
            )}
          </button>
          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            className="btn-secondary flex items-center gap-2 text-red-400 hover:text-red-300"
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </form>
    </div>
  );
}
