import { useEffect, useState } from 'react';
import { Plus, Apple, Trash2, X, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { NutritionLog } from '../lib/supabase';

interface Props { userId: string; }

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-Workout', 'Post-Workout'];

const MEAL_COLORS: Record<string, string> = {
  Breakfast: 'bg-amber-600/20 text-amber-400',
  Lunch: 'bg-emerald-600/20 text-emerald-400',
  Dinner: 'bg-blue-600/20 text-blue-400',
  Snack: 'bg-slate-600/20 text-slate-400',
  'Pre-Workout': 'bg-orange-600/20 text-orange-400',
  'Post-Workout': 'bg-cyan-600/20 text-cyan-400',
};

const QUICK_FOODS = [
  { name: 'Chicken Breast (100g)', calories: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6, serving_size: '100g' },
  { name: 'Brown Rice (100g cooked)', calories: 112, protein_g: 2.6, carbs_g: 23, fat_g: 0.9, serving_size: '100g' },
  { name: 'Egg (1 large)', calories: 72, protein_g: 6, carbs_g: 0.4, fat_g: 5, serving_size: '1 egg' },
  { name: 'Greek Yogurt (100g)', calories: 59, protein_g: 10, carbs_g: 3.6, fat_g: 0.4, serving_size: '100g' },
  { name: 'Banana (medium)', calories: 105, protein_g: 1.3, carbs_g: 27, fat_g: 0.4, serving_size: '1 medium' },
  { name: 'Oats (40g dry)', calories: 154, protein_g: 5.4, carbs_g: 27, fat_g: 2.7, serving_size: '40g' },
  { name: 'Salmon (100g)', calories: 208, protein_g: 20, carbs_g: 0, fat_g: 13, serving_size: '100g' },
  { name: 'Almonds (30g)', calories: 174, protein_g: 6, carbs_g: 6, fat_g: 15, serving_size: '30g' },
];

const CALORIE_GOAL = 2000;
const PROTEIN_GOAL = 150;
const CARBS_GOAL = 250;
const FAT_GOAL = 65;

export default function Nutrition({ userId }: Props) {
  const [logs, setLogs] = useState<NutritionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    food_name: '',
    meal_type: 'Breakfast',
    calories: '',
    protein_g: '',
    carbs_g: '',
    fat_g: '',
    fiber_g: '',
    serving_size: '',
  });

  useEffect(() => {
    loadLogs();
  }, [userId, selectedDate]);

  async function loadLogs() {
    setLoading(true);
    const { data } = await supabase
      .from('nutrition_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('log_date', selectedDate)
      .order('created_at');
    setLogs(data || []);
    setLoading(false);
  }

  async function handleSave() {
    if (!form.food_name.trim()) return;
    setSaving(true);
    await supabase.from('nutrition_logs').insert({
      user_id: userId,
      food_name: form.food_name.trim(),
      meal_type: form.meal_type,
      calories: parseInt(form.calories) || 0,
      protein_g: parseFloat(form.protein_g) || 0,
      carbs_g: parseFloat(form.carbs_g) || 0,
      fat_g: parseFloat(form.fat_g) || 0,
      fiber_g: parseFloat(form.fiber_g) || 0,
      serving_size: form.serving_size,
      log_date: selectedDate,
    });
    setSaving(false);
    setShowModal(false);
    resetForm();
    loadLogs();
  }

  async function deleteLog(id: string) {
    await supabase.from('nutrition_logs').delete().eq('id', id);
    setLogs(prev => prev.filter(l => l.id !== id));
  }

  function resetForm() {
    setForm({ food_name: '', meal_type: 'Breakfast', calories: '', protein_g: '', carbs_g: '', fat_g: '', fiber_g: '', serving_size: '' });
  }

  function applyQuickFood(food: typeof QUICK_FOODS[0]) {
    setForm({
      food_name: food.name,
      meal_type: form.meal_type,
      calories: String(food.calories),
      protein_g: String(food.protein_g),
      carbs_g: String(food.carbs_g),
      fat_g: String(food.fat_g),
      fiber_g: '0',
      serving_size: food.serving_size,
    });
  }

  function changeDate(delta: number) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  }

  const grouped = MEAL_TYPES.reduce<Record<string, NutritionLog[]>>((acc, type) => {
    acc[type] = logs.filter(l => l.meal_type === type);
    return acc;
  }, {});

  const totals = {
    calories: logs.reduce((s, l) => s + l.calories, 0),
    protein: logs.reduce((s, l) => s + l.protein_g, 0),
    carbs: logs.reduce((s, l) => s + l.carbs_g, 0),
    fat: logs.reduce((s, l) => s + l.fat_g, 0),
    fiber: logs.reduce((s, l) => s + l.fiber_g, 0),
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Nutrition</h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your daily food intake</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Log Food
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => changeDate(-1)} className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="input flex-1 max-w-48 text-center"
        />
        <button onClick={() => changeDate(1)} disabled={isToday} className="w-8 h-8 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg flex items-center justify-center text-slate-400 transition-colors">
          <ChevronRightIcon size={16} />
        </button>
        {!isToday && (
          <button onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])} className="btn-secondary text-xs">
            Today
          </button>
        )}
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>Daily Summary</h3>
          <span className="text-xs text-slate-500">{logs.length} items logged</span>
        </div>

        <div className="flex items-center gap-6 mb-5">
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#1e293b" strokeWidth="3.5" />
              <circle
                cx="18" cy="18" r="14" fill="none"
                stroke="#3b82f6" strokeWidth="3.5"
                strokeDasharray={`${Math.min((totals.calories / CALORIE_GOAL) * 88, 88)} 88`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-base font-bold text-white leading-none" style={{ fontFamily: 'Syne, sans-serif' }}>
                {totals.calories}
              </span>
              <span className="text-xs text-slate-500 mt-0.5">kcal</span>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            {[
              { label: 'Protein', value: totals.protein, goal: PROTEIN_GOAL, color: 'bg-blue-500', unit: 'g' },
              { label: 'Carbs', value: totals.carbs, goal: CARBS_GOAL, color: 'bg-amber-500', unit: 'g' },
              { label: 'Fat', value: totals.fat, goal: FAT_GOAL, color: 'bg-rose-500', unit: 'g' },
            ].map(({ label, value, goal, color, unit }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-slate-400">{label}</span>
                  <span className="text-slate-300">{Math.round(value)}{unit} / {goal}{unit}</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min((value / goal) * 100, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Calories', value: `${totals.calories}`, goal: `/ ${CALORIE_GOAL}`, over: totals.calories > CALORIE_GOAL },
            { label: 'Protein', value: `${Math.round(totals.protein)}g`, goal: `/ ${PROTEIN_GOAL}g`, over: false },
            { label: 'Carbs', value: `${Math.round(totals.carbs)}g`, goal: `/ ${CARBS_GOAL}g`, over: totals.carbs > CARBS_GOAL },
            { label: 'Fat', value: `${Math.round(totals.fat)}g`, goal: `/ ${FAT_GOAL}g`, over: totals.fat > FAT_GOAL },
          ].map(({ label, value, goal, over }) => (
            <div key={label} className="bg-slate-800/50 rounded-xl p-2.5 text-center">
              <div className={`text-base font-bold ${over ? 'text-red-400' : 'text-white'}`} style={{ fontFamily: 'Syne, sans-serif' }}>
                {value}
              </div>
              <div className="text-xs text-slate-500">{goal}</div>
              <div className="text-xs text-slate-600 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {MEAL_TYPES.map(mealType => {
            const items = grouped[mealType];
            const mealCalories = items.reduce((s, l) => s + l.calories, 0);
            if (items.length === 0) return null;
            return (
              <div key={mealType} className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`badge ${MEAL_COLORS[mealType] || 'bg-slate-700 text-slate-400'}`}>{mealType}</span>
                    <span className="text-xs text-slate-500">{mealCalories} kcal</span>
                  </div>
                  <span className="text-xs text-slate-600">{items.length} item{items.length > 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-2">
                  {items.map(log => (
                    <div key={log.id} className="flex items-center gap-3 p-2.5 bg-slate-800/40 rounded-lg group">
                      <Apple size={13} className="text-slate-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-slate-200 truncate">{log.food_name}</div>
                        {log.serving_size && <div className="text-xs text-slate-600">{log.serving_size}</div>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-shrink-0">
                        <span className="font-medium text-slate-300">{log.calories} kcal</span>
                        <span>P: {Math.round(log.protein_g)}g</span>
                        <span>C: {Math.round(log.carbs_g)}g</span>
                        <span>F: {Math.round(log.fat_g)}g</span>
                      </div>
                      <button
                        onClick={() => deleteLog(log.id)}
                        className="w-6 h-6 bg-red-900/0 group-hover:bg-red-900/30 rounded-md flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {logs.length === 0 && (
            <div className="card p-12 text-center">
              <Apple size={40} className="text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No meals logged for this day</p>
              <p className="text-slate-600 text-sm mt-1">Start tracking your nutrition</p>
              <button onClick={() => setShowModal(true)} className="btn-primary mt-4">
                Log First Meal
              </button>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto slide-up">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
              <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Log Food</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400">
                <X size={15} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="label">Quick Add</label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_FOODS.map(food => (
                    <button
                      key={food.name}
                      onClick={() => applyQuickFood(food)}
                      className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      {food.name.split('(')[0].trim()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-800" />

              <div>
                <label className="label">Food Name *</label>
                <input type="text" value={form.food_name} onChange={e => setForm(p => ({ ...p, food_name: e.target.value }))} placeholder="e.g., Grilled Chicken" className="input" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Meal Type</label>
                  <select value={form.meal_type} onChange={e => setForm(p => ({ ...p, meal_type: e.target.value }))} className="input">
                    {MEAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Serving Size</label>
                  <input type="text" value={form.serving_size} onChange={e => setForm(p => ({ ...p, serving_size: e.target.value }))} placeholder="e.g., 100g" className="input" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Calories (kcal)</label>
                  <input type="number" value={form.calories} onChange={e => setForm(p => ({ ...p, calories: e.target.value }))} placeholder="0" className="input" min="0" />
                </div>
                <div>
                  <label className="label">Protein (g)</label>
                  <input type="number" value={form.protein_g} onChange={e => setForm(p => ({ ...p, protein_g: e.target.value }))} placeholder="0" className="input" min="0" step="0.1" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Carbs (g)</label>
                  <input type="number" value={form.carbs_g} onChange={e => setForm(p => ({ ...p, carbs_g: e.target.value }))} placeholder="0" className="input" min="0" step="0.1" />
                </div>
                <div>
                  <label className="label">Fat (g)</label>
                  <input type="number" value={form.fat_g} onChange={e => setForm(p => ({ ...p, fat_g: e.target.value }))} placeholder="0" className="input" min="0" step="0.1" />
                </div>
                <div>
                  <label className="label">Fiber (g)</label>
                  <input type="number" value={form.fiber_g} onChange={e => setForm(p => ({ ...p, fiber_g: e.target.value }))} placeholder="0" className="input" min="0" step="0.1" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-slate-800">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.food_name.trim()} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : 'Log Food'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
