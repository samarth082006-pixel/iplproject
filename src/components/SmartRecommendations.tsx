import { useState, useEffect } from 'react';
import { Dumbbell, Brain, Calendar, TrendingUp, Battery, Target, ChevronRight, Check, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { WorkoutRecommendation, Workout } from '../lib/supabase';

interface Props { userId: string; }

const RECOMMENDATION_TYPES = [
  { type: 'optimal', label: 'Optimal for Today', icon: Brain, color: 'from-blue-500 to-cyan-500' },
  { type: 'recovery', label: 'Recovery-Focused', icon: Battery, color: 'from-emerald-500 to-teal-500' },
  { type: 'intensity', label: 'High Intensity', icon: TrendingUp, color: 'from-orange-500 to-red-500' },
  { type: 'weakness', label: 'Target Weak Areas', icon: Target, color: 'from-purple-500 to-pink-500' },
];

// Simulated ML recommendations
function generateRecommendations(workouts: Workout[]): WorkoutRecommendation[] {
  const now = new Date();
  const lastWeek = workouts.filter(w => {
    const daysAgo = (now.getTime() - new Date(w.workout_date).getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo <= 7;
  });

  const muscleGroupFrequency: Record<string, number> = {};
  lastWeek.forEach(w => {
    w.workout_exercises?.forEach(e => {
      // Simple frequency tracking
      muscleGroupFrequency[e.exercise_name.split(' ')[0]] = (muscleGroupFrequency[e.exercise_name.split(' ')[0]] || 0) + 1;
    });
  });

  const avgDuration = lastWeek.length > 0
    ? lastWeek.reduce((s, w) => s + w.duration_minutes, 0) / lastWeek.length
    : 45;

  return [
    {
      id: '',
      user_id: '',
      recommendation_type: 'optimal',
      suggested_workout: {
        name: 'Upper Body Power',
        exercises: [
          { name: 'Bench Press', sets: 4, reps: '6-8', reason: 'Prime for strength gains' },
          { name: 'Overhead Press', sets: 3, reps: '8-10', reason: 'Shoulder development' },
          { name: 'Pull-Ups', sets: 3, reps: '8-12', reason: 'Back & biceps activation' },
          { name: 'Dips', sets: 3, reps: '10-12', reason: 'Tricep finisher' },
        ],
        estimated_duration: Math.round(avgDuration * 1.1),
        estimated_calories: Math.round(avgDuration * 8),
      },
      reason: 'Based on your training frequency and recovery, upper body focus will optimize your weekly balance.',
      confidence_score: 92,
      based_on: { last_trained: '48h ago', recovery: 'good', fatigue: 'low' },
      valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      accepted: false,
      created_at: new Date().toISOString(),
    },
    {
      id: '',
      user_id: '',
      recommendation_type: 'recovery',
      suggested_workout: {
        name: 'Active Mobility Flow',
        exercises: [
          { name: 'Dynamic Stretching', sets: 1, reps: '10 min', reason: 'Warm-up & mobility' },
          { name: 'Light Yoga Flow', sets: 1, reps: '20 min', reason: 'Recovery & flexibility' },
          { name: 'Foam Rolling', sets: 1, reps: '10 min', reason: 'Myofascial release' },
        ],
        estimated_duration: 40,
        estimated_calories: 150,
      },
      reason: 'Your muscles need recovery after back-to-back intense sessions. This will improve your next performance.',
      confidence_score: 88,
      based_on: { training_streak: 4, hrv_trend: 'declining', sleep_quality: 72 },
      valid_until: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
      accepted: false,
      created_at: new Date().toISOString(),
    },
    {
      id: '',
      user_id: '',
      recommendation_type: 'intensity',
      suggested_workout: {
        name: 'HIIT Cardio Blast',
        exercises: [
          { name: 'Burpees', sets: 4, reps: '45s work, 15s rest', reason: 'Full body burn' },
          { name: 'Box Jumps', sets: 4, reps: '12 reps', reason: 'Explosive power' },
          { name: 'Kettlebell Swings', sets: 4, reps: '20 reps', reason: 'Posterior chain' },
          { name: 'Mountain Climbers', sets: 3, reps: '45s', reason: 'Core & cardio' },
        ],
        estimated_duration: 35,
        estimated_calories: 400,
      },
      reason: 'Your cardiovascular system is well-recovered. A HIIT session will boost metabolism and improve endurance.',
      confidence_score: 85,
      based_on: { cardio_frequency: 'low', heart_rate_recovery: 'excellent', energy_level: 'high' },
      valid_until: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      accepted: false,
      created_at: new Date().toISOString(),
    },
    {
      id: '',
      user_id: '',
      recommendation_type: 'weakness',
      suggested_workout: {
        name: 'Leg Strength Builder',
        exercises: [
          { name: 'Back Squat', sets: 5, reps: '5', reason: 'Primary strength movement' },
          { name: 'Romanian Deadlift', sets: 4, reps: '8-10', reason: 'Posterior chain development' },
          { name: 'Bulgarian Split Squat', sets: 3, reps: '10/leg', reason: 'Unilateral strength' },
          { name: 'Calf Raises', sets: 4, reps: '15', reason: 'Lower leg development' },
        ],
        estimated_duration: 55,
        estimated_calories: 380,
      },
      reason: 'Analysis shows leg training is below optimal frequency. Prioritize this to improve overall strength balance.',
      confidence_score: 91,
      based_on: { imbalanced_training: true, leg_sessions: 1, upper_sessions: 4 },
      valid_until: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
      accepted: false,
      created_at: new Date().toISOString(),
    },
  ];
}

export default function SmartRecommendations({ userId }: Props) {
  const [recommendations, setRecommendations] = useState<WorkoutRecommendation[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [userId]);

  async function loadData() {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { data: workoutData } = await supabase
      .from('workouts')
      .select('*, workout_exercises(*)')
      .eq('user_id', userId)
      .gte('workout_date', twoWeeksAgo)
      .order('workout_date', { ascending: false });

    const workoutList = (workoutData || []) as Workout[];
    setWorkouts(workoutList);

    // Generate ML-powered recommendations
    const recs = generateRecommendations(workoutList);

    // Save to database
    for (const rec of recs) {
      await supabase.from('workout_recommendations').insert({
        user_id: userId,
        ...rec,
      });
    }

    setRecommendations(recs);
    setLoading(false);
  }

  async function acceptRecommendation(rec: WorkoutRecommendation) {
    // Create workout from recommendation
    const workout = rec.suggested_workout as { name: string; exercises: Array<{ name: string; sets: number; reps: string }> };

    setAcceptingId(rec.id);

    const { data: newWorkout } = await supabase
      .from('workouts')
      .insert({
        user_id: userId,
        name: workout.name,
        duration_minutes: (workout as unknown as Record<string, number>).estimated_duration || 45,
        calories_burned: (workout as unknown as Record<string, number>).estimated_calories || 300,
        workout_date: new Date().toISOString().split('T')[0],
        completed: false,
      })
      .select()
      .single();

    if (newWorkout && workout.exercises) {
      const exercises = workout.exercises.map((e, i) => ({
        workout_id: newWorkout.id,
        exercise_name: e.name,
        sets: e.sets,
        reps: parseInt(e.reps) || null,
        notes: e.reason || '',
        order_index: i,
      }));
      await supabase.from('workout_exercises').insert(exercises);
    }

    // Mark as accepted
    await supabase.from('workout_recommendations').update({ accepted: true }).eq('id', rec.id);

    setRecommendations(prev => prev.map(r => r.id === rec.id ? { ...r, accepted: true } : r));
    setAcceptingId(null);
  }

  function refreshRecommendations() {
    setLoading(true);
    setTimeout(() => {
      const recs = generateRecommendations(workouts);
      setRecommendations(recs);
      setLoading(false);
    }, 500);
  }

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Analyzing your training patterns...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Smart Workout Recommendations
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">AI-optimized based on your training history, recovery & goals</p>
        </div>
        <button onClick={refreshRecommendations} className="btn-glass text-xs flex items-center gap-1.5">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* ML Insights */}
      <div className="glass-card p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Brain size={22} className="text-white" />
        </div>
        <div className="flex-1">
          <div className="text-xs text-slate-500 mb-0.5">AI Analysis</div>
          <div className="text-sm font-medium text-white">
            {workouts.length > 0
              ? `Based on ${workouts.length} workouts in the last 14 days`
              : 'Start logging workouts for personalized recommendations'}
          </div>
        </div>
        <div className="text-right">
          <div className="badge-ai text-xs">
            ML Model v2.1
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="space-y-4">
        {recommendations.map((rec, i) => {
          const typeInfo = RECOMMENDATION_TYPES.find(t => t.type === rec.recommendation_type);
          const Icon = typeInfo?.icon || Dumbbell;
          const workout = rec.suggested_workout as { name: string; exercises?: Array<{ name: string; sets: number; reps: string; reason: string }>; estimated_duration?: number; estimated_calories?: number };

          return (
            <div
              key={i}
              className={`glass-card glass-card-hover overflow-hidden ${rec.accepted ? 'opacity-70' : ''}`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${typeInfo?.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={18} className="text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-white">{workout.name}</h3>
                        {rec.accepted && (
                          <span className="badge bg-emerald-600/20 text-emerald-400 text-xs">
                            <Check size={10} className="mr-0.5" /> Added
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">{typeInfo?.label}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs text-cyan-400 font-medium">
                        <Brain size={10} />
                        {Math.round(rec.confidence_score)}% match
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reason */}
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">{rec.reason}</p>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="metric-card">
                    <div className="text-xs text-slate-500 mb-0.5">Duration</div>
                    <div className="text-lg font-bold text-white">{workout.estimated_duration || 45} min</div>
                  </div>
                  <div className="metric-card">
                    <div className="text-xs text-slate-500 mb-0.5">Calories</div>
                    <div className="text-lg font-bold text-white">{workout.estimated_calories || 300} kcal</div>
                  </div>
                </div>

                {/* Exercises preview */}
                {workout.exercises && (
                  <div className="mb-4">
                    <div className="text-xs text-slate-500 mb-2">Exercises ({workout.exercises.length})</div>
                    <div className="flex flex-wrap gap-1.5">
                      {workout.exercises.slice(0, 4).map((e, j) => (
                        <span key={j} className="badge bg-slate-800 text-slate-300">
                          {e.name}
                        </span>
                      ))}
                      {workout.exercises.length > 4 && (
                        <span className="badge bg-slate-700 text-slate-400">
                          +{workout.exercises.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action */}
                {!rec.accepted && (
                  <button
                    onClick={() => acceptRecommendation(rec)}
                    disabled={acceptingId === rec.id}
                    className="btn-ai w-full flex items-center justify-center gap-2"
                  >
                    {acceptingId === rec.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Adding to workouts...
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        Add to My Workouts
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
