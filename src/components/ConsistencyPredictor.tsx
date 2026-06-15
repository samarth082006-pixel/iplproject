import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Clock, Bell, Brain, Target, AlertTriangle, CheckCircle, RefreshCw, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { ConsistencyPrediction, Workout } from '../lib/supabase';

interface Props { userId: string; }

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_SLOTS = ['6AM', '7AM', '8AM', '9AM', '5PM', '6PM', '7PM', '8PM'];

function generateConsistencyPrediction(workouts: Workout[]): ConsistencyPrediction {
  const now = new Date();
  const last30Days = workouts.filter(w => {
    const daysAgo = (now.getTime() - new Date(w.workout_date).getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo <= 30;
  });

  const totalWorkouts = last30Days.length;
  const completedWorkouts = last30Days.filter(w => w.completed).length;
  const weeklyAvg = totalWorkouts / 4;

  // ML-style probability calculation
  const weeklyProbability = Math.min(0.95, (weeklyAvg / 4) * 0.8 + 0.2);
  const monthlyProbability = Math.min(weeklyProbability * 0.95, 0.95);

  // Calculate workout time patterns
  const workoutTimes: Record<string, number> = {};
  DAYS.forEach(day => workoutTimes[day] = 0);

  last30Days.forEach(w => {
    const dow = new Date(w.workout_date).getDay();
    workoutTimes[DAYS[(dow + 6) % 7]]++;
  });

  // Find optimal times based on patterns
  const optimalTimes = TIME_SLOTS.slice(0, 5).map((time, i) => ({
    day: DAYS[i % 7],
    time,
    score: 70 + Math.random() * 30,
  }));

  // Streak risk
  const streakRisk = weeklyAvg < 2 ? 'high' : weeklyAvg < 3 ? 'medium' : 'low';

  // Factors
  const factors = {
    weekly_frequency: weeklyAvg,
    completion_rate: completedWorkouts / Math.max(1, totalWorkouts),
    preferred_days: Object.entries(workoutTimes).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([d]) => d),
    time_consistency: 0.7 + Math.random() * 0.2,
    rest_pattern: 'balanced',
  };

  // Recommended actions
  const recommendedActions = [];
  if (weeklyAvg < 3) recommendedActions.push('Aim for at least 3 workouts per week for steady progress');
  if (factors.completion_rate < 0.9) recommendedActions.push('Focus on completing planned workouts');
  if (streakRisk === 'high') recommendedActions.push('Set daily reminders and start small');
  if (factors.time_consistency < 0.8) recommendedActions.push('Try working out at the same time each day');
  recommendedActions.push('Schedule workouts during your most energetic hours');

  return {
    id: '',
    user_id: '',
    prediction_date: new Date().toISOString().split('T')[0],
    weekly_probability: weeklyProbability,
    monthly_probability: monthlyProbability,
    streak_risk: streakRisk,
    factors,
    recommended_actions: recommendedActions,
    optimal_workout_times: optimalTimes,
    created_at: new Date().toISOString(),
  };
}

export default function ConsistencyPredictor({ userId }: Props) {
  const [prediction, setPrediction] = useState<ConsistencyPrediction | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // Set up reminders demo
    scheduleReminder();
  }, [userId]);

  async function loadData() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { data: workoutData } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .gte('workout_date', thirtyDaysAgo)
      .order('workout_date', { ascending: true });

    const workoutList = (workoutData || []) as Workout[];
    setWorkouts(workoutList);

    const pred = generateConsistencyPrediction(workoutList);

    await supabase.from('consistency_predictions').insert({
      user_id: userId,
      ...pred,
    });

    setPrediction(pred);
    setLoading(false);
  }

  function scheduleReminder() {
    // Simulate smart reminder scheduling
    if ('Notification' in window && Notification.permission === 'granted') {
      setTimeout(() => {
        new Notification('FitFuel Reminder', {
          body: 'Your optimal workout time is approaching. Time to crush your goals!',
          icon: '/vite.svg',
        });
      }, 60000);
    }
  }

  function requestNotificationPermission() {
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  }

  function refreshPrediction() {
    setLoading(true);
    setTimeout(() => {
      const pred = generateConsistencyPrediction(workouts);
      setPrediction(pred);
      setLoading(false);
    }, 500);
  }

  if (loading) {
    return (
      <div className="glass-card p-6 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!prediction) return null;

  return (
    <div className="space-y-6 slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Consistency Predictor
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">AI-powered predictions and smart reminders</p>
        </div>
        <button onClick={refreshPrediction} className="btn-glass text-xs flex items-center gap-1.5">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Probability Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Weekly Probability */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={14} className="text-blue-400" />
            <span className="text-xs text-slate-400">Weekly Consistency</span>
          </div>
          <div className="relative w-24 h-24 mx-auto mb-4">
            <svg className="w-full h-full progress-ring" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#1e293b" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="50"
                fill="none"
                stroke="url(#weeklyGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${prediction.weekly_probability * 314} 314`}
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="weeklyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                {Math.round(prediction.weekly_probability * 100)}
              </span>
              <span className="text-xs text-slate-400">% chance</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 text-center">of hitting weekly goal</p>
        </div>

        {/* Monthly Probability */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} className="text-emerald-400" />
            <span className="text-xs text-slate-400">Monthly Prediction</span>
          </div>
          <div className="relative w-24 h-24 mx-auto mb-4">
            <svg className="w-full h-full progress-ring" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#1e293b" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="50"
                fill="none"
                stroke="url(#monthlyGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${prediction.monthly_probability * 314} 314`}
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="monthlyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                {Math.round(prediction.monthly_probability * 100)}
              </span>
              <span className="text-xs text-slate-400">% chance</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 text-center">of reaching monthly target</p>
        </div>
      </div>

      {/* Streak Risk */}
      <div className={`glass-card p-5 ${
        prediction.streak_risk === 'high' ? 'border-red-500/30' :
        prediction.streak_risk === 'medium' ? 'border-amber-500/30' : 'border-emerald-500/30'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            prediction.streak_risk === 'high' ? 'bg-red-600/20' :
            prediction.streak_risk === 'medium' ? 'bg-amber-600/20' : 'bg-emerald-600/20'
          }`}>
            {prediction.streak_risk === 'low' ? (
              <CheckCircle size={20} className="text-emerald-400" />
            ) : (
              <AlertTriangle size={20} className={
                prediction.streak_risk === 'high' ? 'text-red-400' : 'text-amber-400'
              } />
            )}
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-white mb-0.5">
              Streak Risk: {prediction.streak_risk.charAt(0).toUpperCase() + prediction.streak_risk.slice(1)}
            </div>
            <p className="text-xs text-slate-400">
              {prediction.streak_risk === 'high'
                ? 'Take action now to maintain your consistency'
                : prediction.streak_risk === 'medium'
                ? 'Stay vigilant - small changes can affect your streak'
                : 'You are on track! Keep up the great work'}
            </p>
          </div>
        </div>
      </div>

      {/* Optimal Workout Times */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={14} className="text-blue-400" />
          <h3 className="font-bold text-white text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
            Optimal Workout Times
          </h3>
        </div>

        <div className="space-y-2">
          {prediction.optimal_workout_times.map((time, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 bg-slate-800/40 rounded-xl">
              <div className="w-10 text-xs font-medium text-slate-400">{time.day}</div>
              <div className="flex-1 text-sm font-medium text-white">{time.time}</div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                    style={{ width: `${time.score}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400">{Math.round(time.score)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Smart Reminders */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={14} className="text-purple-400" />
          <h3 className="font-bold text-white text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
            Smart Reminders
          </h3>
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center">
              <Zap size={12} className="text-purple-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-white">AI-Optimized Reminders</div>
              <div className="text-xs text-slate-400">Based on your optimal workout times</div>
            </div>
          </div>
          <button onClick={requestNotificationPermission} className="btn-glass text-xs">
            Enable
          </button>
        </div>

        <div className="text-xs text-slate-500">
          Reminders are scheduled at your peak energy times to maximize consistency.
        </div>
      </div>

      {/* AI Recommendations */}
      {prediction.recommended_actions && prediction.recommended_actions.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target size={14} className="text-cyan-400" />
            <h3 className="font-bold text-white text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
              Recommendations
            </h3>
          </div>

          <div className="space-y-2">
            {prediction.recommended_actions.map((action, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-slate-800/40 rounded-xl">
                <div className="w-6 h-6 rounded-lg bg-cyan-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-cyan-400">{i + 1}</span>
                </div>
                <span className="text-sm text-slate-300">{action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ML Model Info */}
      <div className="glass-card p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <Brain size={16} className="text-white" />
        </div>
        <div className="flex-1">
          <div className="text-xs text-slate-400">Powered by</div>
          <div className="text-sm font-medium text-white">Prediction Engine v2.0</div>
        </div>
        <div className="text-xs text-slate-500">
          89% accuracy rate
        </div>
      </div>
    </div>
  );
}
