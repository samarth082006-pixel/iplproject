import { useEffect, useState } from 'react';
import {
  Plus, Dumbbell, Clock, Flame, ChevronDown, ChevronUp,
  Trash2, CheckCircle, Circle, X, Search, Filter
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Workout, WorkoutExercise, Exercise } from '../lib/supabase';

interface Props { userId: string; }

type NewExercise = Omit<WorkoutExercise, 'id' | 'workout_id' | 'created_at'>;

export default function Workouts({ userId }: Props) {
  const [workouts, setWorkouts] = useState<(Workout & { workout_exercises: WorkoutExercise[] })[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const [form, setForm] = useState({
    name: '',
    notes: '',
    duration_minutes: '',
    calories_burned: '',
    workout_date: new Date().toISOString().split('T')[0],
  });
  const [modalExercises, setModalExercises] = useState<NewExercise[]>([]);
  const [saving, setSaving] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');

  useEffect(() => {
    loadData();
  }, [userId]);

  async function loadData() {
    const [workoutsRes, exercisesRes] = await Promise.all([
      supabase
        .from('workouts')
        .select('*, workout_exercises(*)')
        .eq('user_id', userId)
        .order('workout_date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase.from('exercises').select('*').order('name'),
    ]);
    setWorkouts((workoutsRes.data || []) as (Workout & { workout_exercises: WorkoutExercise[] })[]);
    setExercises(exercisesRes.data || []);
    setLoading(false);
  }

  function addExercise() {
    setModalExercises(prev => [...prev, {
      exercise_id: null,
      exercise_name: '',
      sets: 3,
      reps: 10,
      weight_kg: null,
      duration_seconds: null,
      distance_km: null,
      notes: '',
      order_index: prev.length,
    }]);
  }

  function removeExercise(i: number) {
    setModalExercises(prev => prev.filter((_, idx) => idx !== i));
  }

  function updateExercise(i: number, field: string, value: string | number | null) {
    setModalExercises(prev => prev.map((ex, idx) => idx === i ? { ...ex, [field]: value } : ex));
  }

  function selectExercise(i: number, ex: Exercise) {
    setModalExercises(prev => prev.map((e, idx) => idx === i ? { ...e, exercise_id: ex.id, exercise_name: ex.name } : e));
    setExerciseSearch('');
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);

    const { data: workout, error } = await supabase
      .from('workouts')
      .insert({
        user_id: userId,
        name: form.name.trim(),
        notes: form.notes,
        duration_minutes: parseInt(form.duration_minutes) || 0,
        calories_burned: parseInt(form.calories_burned) || 0,
        workout_date: form.workout_date,
        completed: true,
      })
      .select()
      .single();

    if (!error && workout && modalExercises.length > 0) {
      const exsToInsert = modalExercises
        .filter(e => e.exercise_name.trim())
        .map((e, i) => ({ ...e, workout_id: workout.id, order_index: i }));
      if (exsToInsert.length > 0) {
        await supabase.from('workout_exercises').insert(exsToInsert);
      }
    }

    setSaving(false);
    setShowModal(false);
    resetForm();
    loadData();
  }

  function resetForm() {
    setForm({ name: '', notes: '', duration_minutes: '', calories_burned: '', workout_date: new Date().toISOString().split('T')[0] });
    setModalExercises([]);
  }

  async function deleteWorkout(id: string) {
    await supabase.from('workouts').delete().eq('id', id);
    setWorkouts(prev => prev.filter(w => w.id !== id));
  }

  async function toggleComplete(workout: Workout) {
    await supabase.from('workouts').update({ completed: !workout.completed }).eq('id', workout.id);
    setWorkouts(prev => prev.map(w => w.id === workout.id ? { ...w, completed: !w.completed } : w));
  }

  const filtered = workouts.filter(w => {
    const matchSearch = w.name.toLowerCase().includes(search.toLowerCase());
    const matchDate = filterDate ? w.workout_date === filterDate : true;
    return matchSearch && matchDate;
  });

  const categoryColors: Record<string, string> = {
    Strength: 'bg-blue-600/20 text-blue-400',
    Cardio: 'bg-emerald-600/20 text-emerald-400',
    Core: 'bg-amber-600/20 text-amber-400',
    HIIT: 'bg-rose-600/20 text-rose-400',
    Flexibility: 'bg-violet-600/20 text-violet-400',
    Recovery: 'bg-slate-600/20 text-slate-400',
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Workouts</h1>
          <p className="text-slate-400 text-sm mt-0.5">{workouts.length} total sessions logged</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Log Workout
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search workouts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <div className="relative">
          <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="input pl-9 w-44"
          />
        </div>
        {filterDate && (
          <button onClick={() => setFilterDate('')} className="btn-secondary text-xs flex items-center gap-1">
            <X size={12} /> Clear filter
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Dumbbell size={40} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No workouts found</p>
          <p className="text-slate-600 text-sm mt-1">Start logging your training sessions</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-4">
            Log First Workout
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(workout => (
            <div key={workout.id} className="card overflow-hidden">
              <div className="p-4 flex items-center gap-3">
                <button onClick={() => toggleComplete(workout)} className="flex-shrink-0">
                  {workout.completed
                    ? <CheckCircle size={20} className="text-emerald-500" />
                    : <Circle size={20} className="text-slate-600 hover:text-slate-400 transition-colors" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white text-sm">{workout.name}</span>
                    {workout.completed && (
                      <span className="badge bg-emerald-600/20 text-emerald-400">Completed</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-slate-500">
                      {new Date(workout.workout_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    {workout.duration_minutes > 0 && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock size={11} /> {workout.duration_minutes}m
                      </span>
                    )}
                    {workout.calories_burned > 0 && (
                      <span className="flex items-center gap-1 text-xs text-orange-400">
                        <Flame size={11} /> {workout.calories_burned} kcal
                      </span>
                    )}
                    {workout.workout_exercises.length > 0 && (
                      <span className="text-xs text-slate-500">{workout.workout_exercises.length} exercises</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {workout.workout_exercises.length > 0 && (
                    <button
                      onClick={() => setExpandedId(expandedId === workout.id ? null : workout.id)}
                      className="w-7 h-7 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors"
                    >
                      {expandedId === workout.id
                        ? <ChevronUp size={14} className="text-slate-400" />
                        : <ChevronDown size={14} className="text-slate-400" />}
                    </button>
                  )}
                  <button
                    onClick={() => deleteWorkout(workout.id)}
                    className="w-7 h-7 bg-red-900/20 hover:bg-red-900/40 rounded-lg flex items-center justify-center transition-colors text-red-400"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {expandedId === workout.id && workout.workout_exercises.length > 0 && (
                <div className="border-t border-slate-800 px-4 py-3">
                  <div className="space-y-2">
                    {workout.workout_exercises
                      .sort((a, b) => a.order_index - b.order_index)
                      .map(ex => (
                        <div key={ex.id} className="flex items-center gap-3 p-2.5 bg-slate-800/40 rounded-lg">
                          <div className="w-6 h-6 bg-blue-600/20 rounded-md flex items-center justify-center flex-shrink-0">
                            <Dumbbell size={11} className="text-blue-400" />
                          </div>
                          <span className="text-sm text-slate-300 flex-1">{ex.exercise_name}</span>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            {ex.sets && ex.reps && <span>{ex.sets}x{ex.reps}</span>}
                            {ex.weight_kg && <span className="text-slate-400">{ex.weight_kg}kg</span>}
                            {ex.duration_seconds && <span>{Math.floor(ex.duration_seconds / 60)}m {ex.duration_seconds % 60}s</span>}
                            {ex.distance_km && <span>{ex.distance_km}km</span>}
                          </div>
                        </div>
                      ))}
                  </div>
                  {workout.notes && (
                    <p className="text-xs text-slate-500 mt-2 px-1">{workout.notes}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto slide-up">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
              <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Log Workout</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400">
                <X size={15} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="label">Workout Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g., Upper Body Push"
                  className="input"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Date</label>
                  <input type="date" value={form.workout_date} onChange={e => setForm(p => ({ ...p, workout_date: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="label">Duration (min)</label>
                  <input type="number" value={form.duration_minutes} onChange={e => setForm(p => ({ ...p, duration_minutes: e.target.value }))} placeholder="45" className="input" min="0" />
                </div>
                <div>
                  <label className="label">Calories</label>
                  <input type="number" value={form.calories_burned} onChange={e => setForm(p => ({ ...p, calories_burned: e.target.value }))} placeholder="300" className="input" min="0" />
                </div>
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="How did it go?" className="input resize-none" rows={2} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">Exercises</label>
                  <button onClick={addExercise} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    <Plus size={12} /> Add exercise
                  </button>
                </div>

                {modalExercises.length === 0 && (
                  <button onClick={addExercise} className="w-full border border-dashed border-slate-700 rounded-xl p-4 text-slate-500 hover:text-slate-400 hover:border-slate-600 transition-colors text-sm flex items-center justify-center gap-2">
                    <Plus size={15} /> Add exercises to this workout
                  </button>
                )}

                <div className="space-y-3">
                  {modalExercises.map((ex, i) => (
                    <div key={i} className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={ex.exercise_name}
                            onChange={e => { updateExercise(i, 'exercise_name', e.target.value); setExerciseSearch(e.target.value); }}
                            onFocus={() => setExerciseSearch(ex.exercise_name)}
                            placeholder="Exercise name"
                            className="input text-xs py-2"
                          />
                          {exerciseSearch && ex.exercise_name === exerciseSearch && exercises.filter(e =>
                            e.name.toLowerCase().includes(exerciseSearch.toLowerCase())
                          ).length > 0 && (
                            <div className="absolute top-full left-0 right-0 z-20 bg-slate-800 border border-slate-700 rounded-xl mt-1 max-h-36 overflow-y-auto shadow-xl">
                              {exercises
                                .filter(e => e.name.toLowerCase().includes(exerciseSearch.toLowerCase()))
                                .slice(0, 8)
                                .map(e => (
                                  <button
                                    key={e.id}
                                    onClick={() => selectExercise(i, e)}
                                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 flex items-center justify-between"
                                  >
                                    <span>{e.name}</span>
                                    <span className={`badge text-xs ${categoryColors[e.category] || 'bg-slate-700 text-slate-400'}`}>{e.category}</span>
                                  </button>
                                ))}
                            </div>
                          )}
                        </div>
                        <button onClick={() => removeExercise(i)} className="w-6 h-6 bg-red-900/30 hover:bg-red-900/50 rounded-md flex items-center justify-center text-red-400 flex-shrink-0">
                          <X size={11} />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs text-slate-500 mb-0.5 block">Sets</label>
                          <input type="number" value={ex.sets} onChange={e => updateExercise(i, 'sets', parseInt(e.target.value))} className="input text-xs py-1.5" min="1" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 mb-0.5 block">Reps</label>
                          <input type="number" value={ex.reps ?? ''} onChange={e => updateExercise(i, 'reps', e.target.value ? parseInt(e.target.value) : null)} className="input text-xs py-1.5" placeholder="10" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 mb-0.5 block">Weight (kg)</label>
                          <input type="number" value={ex.weight_kg ?? ''} onChange={e => updateExercise(i, 'weight_kg', e.target.value ? parseFloat(e.target.value) : null)} className="input text-xs py-1.5" placeholder="0" step="0.5" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-slate-800">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name.trim()} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : 'Save Workout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
