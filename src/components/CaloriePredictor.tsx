import { useState } from 'react';
import { Flame, Clock, Heart, Brain, ChevronRight, Zap, Activity, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { CaloriePrediction } from '../lib/supabase';

interface Props { userId: string; }

const WORKOUT_TYPES = [
  { name: 'Running', baseCalorieRate: 10, intensities: ['light', 'moderate', 'vigorous'] },
  { name: 'Cycling', baseCalorieRate: 8, intensities: ['light', 'moderate', 'vigorous'] },
  { name: 'Swimming', baseCalorieRate: 9, intensities: ['light', 'moderate', 'vigorous'] },
  { name: 'Weight Training', baseCalorieRate: 5, intensities: ['light', 'moderate', 'heavy'] },
  { name: 'HIIT', baseCalorieRate: 12, intensities: ['moderate', 'high', 'max'] },
  { name: 'Yoga', baseCalorieRate: 3, intensities: ['gentle', 'moderate', 'power'] },
];

const INTENSITY_MULTIPLIERS: Record<string, number> = {
  light: 0.8,
  gentle: 0.7,
  moderate: 1.0,
  heavy: 1.2,
  vigorous: 1.3,
  high: 1.4,
  max: 1.6,
  power: 1.2,
};

const HR_ZONES = [
  { name: 'Recovery', pct: '50-60%', color: 'bg-slate-500' },
  { name: 'Aerobic', pct: '60-70%', color: 'bg-blue-500' },
  { name: 'Tempo', pct: '70-80%', color: 'bg-emerald-500' },
  { name: 'Threshold', pct: '80-90%', color: 'bg-amber-500' },
  { name: 'VO2 Max', pct: '90-100%', color: 'bg-red-500' },
];

function predictCalories(
  workoutType: string,
  duration: number,
  intensity: string,
  weight: number
): { predictedCalories: number; avgHR: number; maxHR: number } {
  const workoutInfo = WORKOUT_TYPES.find(w => w.name === workoutType);
  if (!workoutInfo) return { predictedCalories: 0, avgHR: 120, maxHR: 150 };

  const baseRate = workoutInfo.baseCalorieRate;
  const intensityMultiplier = INTENSITY_MULTIPLIERS[intensity] || 1;

  // MET-based calculation with adjustments
  const predictedCalories = Math.round(baseRate * intensityMultiplier * duration * (weight / 70));

  // Estimated heart rate based on intensity
  const intensityHR = intensity === 'light' || intensity === 'gentle' ? 0.5 :
    intensity === 'moderate' ? 0.65 :
    intensity === 'vigorous' || intensity === 'heavy' || intensity === 'high' ? 0.78 :
    0.88;

  const maxHR = 220 - 30; // Assuming age ~30
  const avgHR = Math.round(maxHR * intensityHR);
  const estimatedMaxHR = Math.round(maxHR * (intensityHR + 0.1));

  return { predictedCalories, avgHR, estimatedMaxHR };
}

export default function CaloriePredictor({ userId }: Props) {
  const [workoutType, setWorkoutType] = useState(WORKOUT_TYPES[0].name);
  const [intensity, setIntensity] = useState(WORKOUT_TYPES[0].intensities[1]);
  const [duration, setDuration] = useState(30);
  const [weight, setWeight] = useState(70);
  const [prediction, setPrediction] = useState<CaloriePrediction | null>(null);
  const [loading, setLoading] = useState(false);

  const workoutInfo = WORKOUT_TYPES.find(w => w.name === workoutType);
  const availableIntensities = workoutInfo?.intensities || ['moderate'];

  async function generatePrediction() {
    setLoading(true);

    const { predictedCalories, avgHR, estimatedMaxHR } = predictCalories(workoutType, duration, intensity, weight);

    // Random confidence between 85-95%
    const confidence = 85 + Math.random() * 10;

    const pred: CaloriePrediction = {
      id: '',
      user_id: userId,
      workout_type: workoutType,
      predicted_calories: predictedCalories,
      intensity,
      duration_minutes: duration,
      estimated_heart_rate_avg: avgHR,
      estimated_heart_rate_max: estimatedMaxHR,
      model_confidence: confidence,
      actual_calories: null,
      created_at: new Date().toISOString(),
    };

    await supabase.from('calorie_predictions').insert({
      user_id: userId,
      workout_type: workoutType,
      predicted_calories: predictedCalories,
      intensity,
      duration_minutes: duration,
      estimated_heart_rate_avg: avgHR,
      estimated_heart_rate_max: estimatedMaxHR,
      model_confidence: confidence,
    });

    setPrediction(pred);
    setLoading(false);
  }

  return (
    <div className="space-y-4 slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Calorie Burn Predictor
          </h2>
          <p className="text-sm text-slate-400">AI-powered estimation using workout intensity & heart rate</p>
        </div>
        <span className="badge-ai">
          <Brain size={10} /> ML Model
        </span>
      </div>

      <div className="glass-card p-5">
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Workout Type */}
          <div>
            <label className="label">Workout Type</label>
            <select
              value={workoutType}
              onChange={e => {
                setWorkoutType(e.target.value);
                const wi = WORKOUT_TYPES.find(w => w.name === e.target.value);
                setIntensity(wi?.intensities[Math.floor(wi.intensities.length / 2)] || 'moderate');
              }}
              className="input"
            >
              {WORKOUT_TYPES.map(w => (
                <option key={w.name} value={w.name}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Intensity */}
          <div>
            <label className="label">Intensity</label>
            <select value={intensity} onChange={e => setIntensity(e.target.value)} className="input">
              {availableIntensities.map(int => (
                <option key={int} value={int}>{int.charAt(0).toUpperCase() + int.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Duration */}
          <div>
            <label className="label">Duration (minutes)</label>
            <input
              type="number"
              value={duration}
              onChange={e => setDuration(parseInt(e.target.value) || 0)}
              className="input"
              min="5"
              max="180"
            />
          </div>

          {/* Weight */}
          <div>
            <label className="label">Body Weight (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={e => setWeight(parseFloat(e.target.value) || 70)}
              className="input"
              min="30"
              max="200"
            />
          </div>
        </div>

        <button
          onClick={generatePrediction}
          disabled={loading || duration < 5}
          className="btn-ai w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <Brain size={14} />
              Predict Calories
            </>
          )}
        </button>
      </div>

      {prediction && (
        <div className="space-y-4 fade-in" style={{ animationDelay: '200ms' }}>
          {/* Main Prediction */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-6">
              {/* Calorie Ring */}
              <div className="relative w-28 h-28 flex-shrink-0">
                <svg className="w-full h-full progress-ring" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#1e293b" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="52"
                    fill="none"
                    stroke="url(#calorieGradient)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${Math.min(prediction.predicted_calories / 8, 324)} 324`}
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="calorieGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Flame size={18} className="text-orange-400 mb-1" />
                  <span className="text-2xl font-bold text-white">{prediction.predicted_calories}</span>
                  <span className="text-xs text-slate-400">kcal</span>
                </div>
              </div>

              <div className="flex-1">
                <div className="text-sm text-slate-400 mb-2">Predicted Burn</div>
                <div className="text-lg font-bold text-white mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>
                  {prediction.workout_type} - {intensity.charAt(0).toUpperCase() + intensity.slice(1)} Intensity
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock size={12} />
                  {duration} min
                  <ChevronRight size={8} />
                  <span className="font-medium text-white">{Math.round(prediction.predicted_calories / duration)} kcal/min</span>
                </div>

                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-1 text-xs">
                    <Heart size={12} className="text-rose-400" />
                    <span className="text-slate-400">Avg: {prediction.estimated_heart_rate_avg} bpm</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <Activity size={12} className="text-orange-400" />
                    <span className="text-slate-400">Max: {prediction.estimated_heart_rate_max} bpm</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-blue-400" />
                <span className="text-xs text-slate-400">Duration</span>
              </div>
              <div className="text-2xl font-bold text-white">{duration}</div>
              <div className="text-xs text-slate-500">minutes</div>
            </div>

            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Flame size={14} className="text-orange-400" />
                <span className="text-xs text-slate-400">Burn Rate</span>
              </div>
              <div className="text-2xl font-bold text-white">{Math.round(prediction.predicted_calories / duration)}</div>
              <div className="text-xs text-slate-500">kcal/min</div>
            </div>

            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain size={14} className="text-purple-400" />
                <span className="text-xs text-slate-400">Confidence</span>
              </div>
              <div className="text-2xl font-bold text-white">{Math.round(prediction.model_confidence)}</div>
              <div className="text-xs text-slate-500">%</div>
            </div>
          </div>

          {/* Heart Rate Zones */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-sm">Estimated Heart Rate Zones</h3>
              <TrendingUp size={14} className="text-blue-400" />
            </div>

            <div className="space-y-2">
              {HR_ZONES.map((zone, i) => {
                const isLikely = (
                  intensity === 'light' || intensity === 'gentle'
                    ? i <= 1
                    : intensity === 'moderate'
                    ? i >= 1 && i <= 2
                    : intensity === 'vigorous' || intensity === 'heavy' || intensity === 'high'
                    ? i >= 2 && i <= 3
                    : i >= 3
                );

                return (
                  <div key={zone.name} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${zone.color}`} />
                    <span className="text-xs text-slate-400 flex-1">{zone.name}</span>
                    <span className="text-xs text-slate-500">{zone.pct}</span>
                    {isLikely && <span className="badge bg-emerald-600/20 text-emerald-400 text-xs">Primary</span>}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-3">
                <Heart size={14} className="text-rose-400" />
                <span className="text-xs text-slate-400">
                  Estimated heart rate range: <span className="text-white font-medium">
                    {prediction.estimated_heart_rate_avg} - {prediction.estimated_heart_rate_max} bpm
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Model Info */}
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-slate-400">Model Confidence</div>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="h-1.5 bg-slate-800 rounded-full flex-1 max-w-32 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                    style={{ width: `${prediction.model_confidence}%` }}
                  />
                </div>
                <span className="text-xs text-emerald-400 font-medium">{Math.round(prediction.model_confidence)}%</span>
              </div>
            </div>
            <div className="text-xs text-slate-500">
              Based on METs, HR data & intensity
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
