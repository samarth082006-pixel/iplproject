import { useEffect, useState } from 'react';
import { Plus, TrendingUp, TrendingDown, Scale, X, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { BodyMetric, Workout } from '../lib/supabase';

interface Props { userId: string; }

function MiniChart({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return <div className="text-xs text-slate-600">Not enough data</div>;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 120;
  const h = 40;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 8) - 4;
    return `${x},${y}`;
  });
  const pathD = `M ${pts.join(' L ')}`;
  const areaD = `M ${pts[0]} L ${pts.join(' L ')} L ${w},${h} L 0,${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#grad-${color})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1].split(',')[0]} cy={pts[pts.length - 1].split(',')[1]} r="2.5" fill={color} />
    </svg>
  );
}

export default function Progress({ userId }: Props) {
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    weight_kg: '',
    body_fat_percent: '',
    muscle_mass_kg: '',
    waist_cm: '',
    chest_cm: '',
    hips_cm: '',
    notes: '',
    recorded_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadData();
  }, [userId]);

  async function loadData() {
    const thirtyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const [metricsRes, workoutsRes] = await Promise.all([
      supabase.from('body_metrics').select('*').eq('user_id', userId).order('recorded_date', { ascending: true }),
      supabase.from('workouts').select('*').eq('user_id', userId).gte('workout_date', thirtyDaysAgo).order('workout_date'),
    ]);
    setMetrics(metricsRes.data || []);
    setWorkouts(workoutsRes.data || []);
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    await supabase.from('body_metrics').insert({
      user_id: userId,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
      body_fat_percent: form.body_fat_percent ? parseFloat(form.body_fat_percent) : null,
      muscle_mass_kg: form.muscle_mass_kg ? parseFloat(form.muscle_mass_kg) : null,
      waist_cm: form.waist_cm ? parseFloat(form.waist_cm) : null,
      chest_cm: form.chest_cm ? parseFloat(form.chest_cm) : null,
      hips_cm: form.hips_cm ? parseFloat(form.hips_cm) : null,
      notes: form.notes,
      recorded_date: form.recorded_date,
    });
    setSaving(false);
    setShowModal(false);
    setForm({ weight_kg: '', body_fat_percent: '', muscle_mass_kg: '', waist_cm: '', chest_cm: '', hips_cm: '', notes: '', recorded_date: new Date().toISOString().split('T')[0] });
    loadData();
  }

  const workoutFrequency = Array.from({ length: 12 }, (_, i) => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (11 - i) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const count = workouts.filter(w => {
      const d = new Date(w.workout_date);
      return d >= weekStart && d <= weekEnd;
    }).length;
    return { week: `W${i + 1}`, count };
  });

  const maxFreq = Math.max(...workoutFrequency.map(w => w.count), 1);

  const weightData = metrics.filter(m => m.weight_kg).map(m => m.weight_kg as number);
  const bodyFatData = metrics.filter(m => m.body_fat_percent).map(m => m.body_fat_percent as number);

  const latest = metrics[metrics.length - 1];
  const prev = metrics[metrics.length - 2];

  function getTrend(curr: number | null | undefined, previous: number | null | undefined) {
    if (!curr || !previous) return null;
    const diff = curr - previous;
    return { diff, up: diff > 0 };
  }

  const weightTrend = latest && prev ? getTrend(latest.weight_kg, prev.weight_kg) : null;
  const bfTrend = latest && prev ? getTrend(latest.body_fat_percent, prev.body_fat_percent) : null;

  const monthlyCalories = workouts.reduce((s, w) => s + w.calories_burned, 0);
  const monthlyDuration = workouts.reduce((s, w) => s + w.duration_minutes, 0);
  const completedWorkouts = workouts.filter(w => w.completed).length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Progress</h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your fitness journey over time</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Log Metrics
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Workouts (90d)', value: workouts.length, sub: `${completedWorkouts} completed`, color: 'text-blue-400 bg-blue-600/20' },
          { label: 'Active Minutes', value: `${monthlyDuration}`, sub: 'last 90 days', color: 'text-emerald-400 bg-emerald-600/20' },
          { label: 'Calories Burned', value: monthlyCalories.toLocaleString(), sub: 'last 90 days', color: 'text-orange-400 bg-orange-600/20' },
          { label: 'Check-ins', value: metrics.length, sub: 'body metrics logged', color: 'text-cyan-400 bg-cyan-600/20' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="card p-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${color.split(' ')[1]}`}>
              <Activity size={15} className={color.split(' ')[0]} />
            </div>
            <div className="text-xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
            <div className="text-xs text-slate-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-white text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>Workout Frequency (12 weeks)</h3>
          <span className="text-xs text-slate-500">Avg {(workouts.length / 12).toFixed(1)}/week</span>
        </div>
        <div className="flex items-end gap-1.5 h-32">
          {workoutFrequency.map(({ week, count }, i) => {
            const height = count > 0 ? Math.max((count / maxFreq) * 100, 15) : 0;
            const isLast = i === workoutFrequency.length - 1;
            return (
              <div key={week} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center" style={{ height: '104px' }}>
                  {count > 0 ? (
                    <div
                      className={`w-full rounded-t-md ${isLast ? 'bg-blue-500' : 'bg-blue-600/40'}`}
                      style={{ height: `${height}%` }}
                    />
                  ) : (
                    <div className="w-full h-1 bg-slate-800 rounded" />
                  )}
                </div>
                <span className={`text-xs ${isLast ? 'text-blue-400' : 'text-slate-700'}`}>{week}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Scale size={16} className="text-blue-400" />
              <h3 className="font-bold text-white text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>Body Weight</h3>
            </div>
            {latest?.weight_kg && (
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{latest.weight_kg} kg</span>
                {weightTrend && (
                  <span className={`flex items-center gap-0.5 text-xs font-medium ${weightTrend.up ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {weightTrend.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {Math.abs(Number(weightTrend.diff.toFixed(1)))}kg
                  </span>
                )}
              </div>
            )}
          </div>
          {weightData.length >= 2 ? (
            <MiniChart data={weightData} color="#3b82f6" />
          ) : (
            <div className="text-center py-6">
              <Scale size={24} className="text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-xs">Log at least 2 entries to see trend</p>
            </div>
          )}
          {metrics.slice(-5).reverse().map(m => m.weight_kg && (
            <div key={m.id} className="flex justify-between text-xs text-slate-500 py-1.5 border-t border-slate-800/50 first:mt-3 first:border-t">
              <span>{new Date(m.recorded_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              <span className="text-slate-300 font-medium">{m.weight_kg} kg</span>
            </div>
          ))}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingDown size={16} className="text-rose-400" />
              <h3 className="font-bold text-white text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>Body Fat %</h3>
            </div>
            {latest?.body_fat_percent && (
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{latest.body_fat_percent}%</span>
                {bfTrend && (
                  <span className={`flex items-center gap-0.5 text-xs font-medium ${bfTrend.up ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {bfTrend.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {Math.abs(Number(bfTrend.diff.toFixed(1)))}%
                  </span>
                )}
              </div>
            )}
          </div>
          {bodyFatData.length >= 2 ? (
            <MiniChart data={bodyFatData} color="#f43f5e" />
          ) : (
            <div className="text-center py-6">
              <Activity size={24} className="text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-xs">Log at least 2 entries to see trend</p>
            </div>
          )}
          {metrics.slice(-5).reverse().map(m => m.body_fat_percent && (
            <div key={m.id} className="flex justify-between text-xs text-slate-500 py-1.5 border-t border-slate-800/50 first:mt-3 first:border-t">
              <span>{new Date(m.recorded_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              <span className="text-slate-300 font-medium">{m.body_fat_percent}%</span>
            </div>
          ))}
        </div>
      </div>

      {metrics.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold text-white text-sm mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>Measurement History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-slate-800">
                  <th className="text-left py-2 pr-4">Date</th>
                  <th className="text-right py-2 px-3">Weight</th>
                  <th className="text-right py-2 px-3">Body Fat</th>
                  <th className="text-right py-2 px-3">Waist</th>
                  <th className="text-right py-2 px-3">Chest</th>
                  <th className="text-right py-2 pl-3">Hips</th>
                </tr>
              </thead>
              <tbody>
                {metrics.slice().reverse().slice(0, 10).map(m => (
                  <tr key={m.id} className="border-b border-slate-800/40 hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 pr-4 text-slate-400 text-xs">
                      {new Date(m.recorded_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="text-right py-2.5 px-3 text-slate-200">{m.weight_kg ? `${m.weight_kg} kg` : '—'}</td>
                    <td className="text-right py-2.5 px-3 text-slate-200">{m.body_fat_percent ? `${m.body_fat_percent}%` : '—'}</td>
                    <td className="text-right py-2.5 px-3 text-slate-200">{m.waist_cm ? `${m.waist_cm} cm` : '—'}</td>
                    <td className="text-right py-2.5 px-3 text-slate-200">{m.chest_cm ? `${m.chest_cm} cm` : '—'}</td>
                    <td className="text-right py-2.5 pl-3 text-slate-200">{m.hips_cm ? `${m.hips_cm} cm` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {metrics.length === 0 && (
        <div className="card p-12 text-center">
          <TrendingUp size={40} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No body metrics logged yet</p>
          <p className="text-slate-600 text-sm mt-1">Start tracking to see your progress over time</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-4">Log First Measurement</button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto slide-up">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
              <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Log Measurements</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400">
                <X size={15} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label">Date</label>
                <input type="date" value={form.recorded_date} onChange={e => setForm(p => ({ ...p, recorded_date: e.target.value }))} className="input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Weight (kg)</label>
                  <input type="number" value={form.weight_kg} onChange={e => setForm(p => ({ ...p, weight_kg: e.target.value }))} placeholder="75.0" className="input" step="0.1" min="0" />
                </div>
                <div>
                  <label className="label">Body Fat (%)</label>
                  <input type="number" value={form.body_fat_percent} onChange={e => setForm(p => ({ ...p, body_fat_percent: e.target.value }))} placeholder="15.0" className="input" step="0.1" min="0" max="60" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Muscle Mass (kg)</label>
                  <input type="number" value={form.muscle_mass_kg} onChange={e => setForm(p => ({ ...p, muscle_mass_kg: e.target.value }))} placeholder="40.0" className="input" step="0.1" min="0" />
                </div>
                <div>
                  <label className="label">Waist (cm)</label>
                  <input type="number" value={form.waist_cm} onChange={e => setForm(p => ({ ...p, waist_cm: e.target.value }))} placeholder="80.0" className="input" step="0.1" min="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Chest (cm)</label>
                  <input type="number" value={form.chest_cm} onChange={e => setForm(p => ({ ...p, chest_cm: e.target.value }))} placeholder="95.0" className="input" step="0.1" min="0" />
                </div>
                <div>
                  <label className="label">Hips (cm)</label>
                  <input type="number" value={form.hips_cm} onChange={e => setForm(p => ({ ...p, hips_cm: e.target.value }))} placeholder="90.0" className="input" step="0.1" min="0" />
                </div>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="How are you feeling?" className="input resize-none" rows={2} />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-slate-800">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : 'Save Metrics'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
