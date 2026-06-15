import { useEffect, useState } from 'react';
import { Plus, Target, X, Trash2, CheckCircle, Award, TrendingUp, CreditCard as Edit3 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Goal } from '../lib/supabase';

interface Props { userId: string; }

const GOAL_TYPES = [
  { value: 'weight_loss', label: 'Weight Loss', icon: '', color: 'text-rose-400 bg-rose-600/20' },
  { value: 'muscle_gain', label: 'Muscle Gain', icon: '', color: 'text-blue-400 bg-blue-600/20' },
  { value: 'strength', label: 'Strength', icon: '', color: 'text-amber-400 bg-amber-600/20' },
  { value: 'cardio', label: 'Cardio / Endurance', icon: '', color: 'text-emerald-400 bg-emerald-600/20' },
  { value: 'nutrition', label: 'Nutrition', icon: '', color: 'text-green-400 bg-green-600/20' },
  { value: 'habit', label: 'Habit / Consistency', icon: '', color: 'text-cyan-400 bg-cyan-600/20' },
  { value: 'other', label: 'Other', icon: '', color: 'text-slate-400 bg-slate-600/20' },
];

type GoalFilter = 'active' | 'completed' | 'all';

export default function Goals({ userId }: Props) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [filter, setFilter] = useState<GoalFilter>('active');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    goal_type: 'strength',
    target_value: '',
    current_value: '',
    unit: '',
    target_date: '',
  });

  useEffect(() => {
    loadGoals();
  }, [userId]);

  async function loadGoals() {
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setGoals(data || []);
    setLoading(false);
  }

  function openCreate() {
    setEditGoal(null);
    setForm({ title: '', description: '', goal_type: 'strength', target_value: '', current_value: '0', unit: '', target_date: '' });
    setShowModal(true);
  }

  function openEdit(goal: Goal) {
    setEditGoal(goal);
    setForm({
      title: goal.title,
      description: goal.description,
      goal_type: goal.goal_type,
      target_value: goal.target_value ? String(goal.target_value) : '',
      current_value: String(goal.current_value),
      unit: goal.unit,
      target_date: goal.target_date || '',
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);

    const payload = {
      user_id: userId,
      title: form.title.trim(),
      description: form.description,
      goal_type: form.goal_type,
      target_value: form.target_value ? parseFloat(form.target_value) : null,
      current_value: parseFloat(form.current_value) || 0,
      unit: form.unit,
      target_date: form.target_date || null,
    };

    if (editGoal) {
      await supabase.from('goals').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editGoal.id);
    } else {
      await supabase.from('goals').insert(payload);
    }

    setSaving(false);
    setShowModal(false);
    loadGoals();
  }

  async function deleteGoal(id: string) {
    await supabase.from('goals').delete().eq('id', id);
    setGoals(prev => prev.filter(g => g.id !== id));
  }

  async function toggleComplete(goal: Goal) {
    const updated = { completed: !goal.completed, updated_at: new Date().toISOString() };
    await supabase.from('goals').update(updated).eq('id', goal.id);
    setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, ...updated } : g));
  }

  async function updateProgress(goal: Goal, newValue: number) {
    const isComplete = goal.target_value ? newValue >= goal.target_value : false;
    const updated = {
      current_value: newValue,
      completed: isComplete,
      updated_at: new Date().toISOString(),
    };
    await supabase.from('goals').update(updated).eq('id', goal.id);
    setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, ...updated } : g));
  }

  const filtered = goals.filter(g => {
    if (filter === 'active') return !g.completed;
    if (filter === 'completed') return g.completed;
    return true;
  });

  const activeCount = goals.filter(g => !g.completed).length;
  const completedCount = goals.filter(g => g.completed).length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Goals</h1>
          <p className="text-slate-400 text-sm mt-0.5">{activeCount} active · {completedCount} completed</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Goal
        </button>
      </div>

      <div className="flex gap-2">
        {(['active', 'completed', 'all'] as GoalFilter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {goals.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {GOAL_TYPES.slice(0, 4).map(({ value, label, color }) => {
            const count = goals.filter(g => g.goal_type === value).length;
            if (count === 0) return null;
            return (
              <div key={value} className="card p-3 flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color.split(' ')[1]}`}>
                  <Target size={13} className={color.split(' ')[0]} />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{count}</div>
                  <div className="text-xs text-slate-500">{label}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Target size={40} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">
            {filter === 'completed' ? 'No completed goals yet' : 'No active goals'}
          </p>
          <p className="text-slate-600 text-sm mt-1">
            {filter === 'completed' ? 'Keep working toward your goals!' : 'Set a goal to stay motivated'}
          </p>
          {filter !== 'completed' && (
            <button onClick={openCreate} className="btn-primary mt-4">Create Your First Goal</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(goal => {
            const pct = goal.target_value ? Math.min((goal.current_value / goal.target_value) * 100, 100) : 0;
            const typeInfo = GOAL_TYPES.find(t => t.value === goal.goal_type);
            const daysLeft = goal.target_date
              ? Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : null;

            return (
              <div key={goal.id} className={`card p-5 transition-all ${goal.completed ? 'opacity-70' : ''}`}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm ${typeInfo?.color.split(' ')[1] || 'bg-slate-700'}`}>
                      {typeInfo?.icon || ''}
                    </div>
                    <div className="min-w-0">
                      <div className={`font-semibold text-sm ${goal.completed ? 'line-through text-slate-500' : 'text-white'} truncate`}>
                        {goal.title}
                      </div>
                      <div className="text-xs text-slate-500">{typeInfo?.label || goal.goal_type}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {!goal.completed && (
                      <button onClick={() => openEdit(goal)} className="w-7 h-7 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400 transition-colors">
                        <Edit3 size={12} />
                      </button>
                    )}
                    <button onClick={() => toggleComplete(goal)} className="w-7 h-7 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors">
                      {goal.completed
                        ? <CheckCircle size={14} className="text-emerald-400" />
                        : <CheckCircle size={14} className="text-slate-600 hover:text-emerald-400 transition-colors" />}
                    </button>
                    <button onClick={() => deleteGoal(goal.id)} className="w-7 h-7 bg-red-900/20 hover:bg-red-900/40 rounded-lg flex items-center justify-center text-red-400 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {goal.description && (
                  <p className="text-xs text-slate-500 mb-3 leading-relaxed">{goal.description}</p>
                )}

                {goal.target_value && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-400">Progress</span>
                      <span className="text-slate-300 font-medium">
                        {goal.current_value} / {goal.target_value} {goal.unit}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${goal.completed ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-slate-600">{Math.round(pct)}% complete</span>
                      {!goal.completed && goal.target_value && (
                        <span className="text-slate-600">{Math.max(0, goal.target_value - goal.current_value)} {goal.unit} to go</span>
                      )}
                    </div>
                  </div>
                )}

                {!goal.completed && goal.target_value && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800">
                    <TrendingUp size={12} className="text-slate-500 flex-shrink-0" />
                    <input
                      type="number"
                      defaultValue={goal.current_value}
                      key={goal.current_value}
                      onBlur={e => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val !== goal.current_value) updateProgress(goal, val);
                      }}
                      className="input text-xs py-1.5 flex-1"
                      placeholder="Update current value"
                      min="0"
                      step="0.1"
                    />
                    <span className="text-xs text-slate-500">{goal.unit}</span>
                  </div>
                )}

                <div className="flex items-center gap-3 mt-2 pt-2">
                  {goal.completed && (
                    <div className="flex items-center gap-1 text-xs text-emerald-400">
                      <Award size={12} />
                      <span>Completed!</span>
                    </div>
                  )}
                  {daysLeft !== null && !goal.completed && (
                    <span className={`text-xs ${daysLeft <= 0 ? 'text-red-400' : daysLeft <= 7 ? 'text-amber-400' : 'text-slate-500'}`}>
                      {daysLeft <= 0 ? 'Overdue' : `${daysLeft} days left`}
                    </span>
                  )}
                  {goal.target_date && (
                    <span className="text-xs text-slate-600 ml-auto">
                      Due {new Date(goal.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto slide-up">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
              <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                {editGoal ? 'Edit Goal' : 'New Goal'}
              </h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400">
                <X size={15} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="label">Goal Title *</label>
                <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g., Bench press 100kg" className="input" />
              </div>

              <div>
                <label className="label">Goal Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {GOAL_TYPES.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setForm(p => ({ ...p, goal_type: value }))}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${
                        form.goal_type === value
                          ? 'border-blue-600 bg-blue-600/10 text-white'
                          : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-xs">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="What does success look like?" className="input resize-none" rows={2} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Target Value</label>
                  <input type="number" value={form.target_value} onChange={e => setForm(p => ({ ...p, target_value: e.target.value }))} placeholder="100" className="input" min="0" step="0.1" />
                </div>
                <div>
                  <label className="label">Current Value</label>
                  <input type="number" value={form.current_value} onChange={e => setForm(p => ({ ...p, current_value: e.target.value }))} placeholder="0" className="input" min="0" step="0.1" />
                </div>
                <div>
                  <label className="label">Unit</label>
                  <input type="text" value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} placeholder="kg, reps..." className="input" />
                </div>
              </div>

              <div>
                <label className="label">Target Date (optional)</label>
                <input type="date" value={form.target_date} onChange={e => setForm(p => ({ ...p, target_date: e.target.value }))} className="input" min={new Date().toISOString().split('T')[0]} />
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-slate-800">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.title.trim()} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : (editGoal ? 'Update Goal' : 'Create Goal')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
