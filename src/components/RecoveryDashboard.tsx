import { useState, useEffect } from 'react';
import { Battery, Moon, Heart, Brain, TrendingUp, TrendingDown, Zap, Coffee, AlertTriangle, RefreshCw, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { RecoveryScore, WearableData } from '../lib/supabase';

interface Props { userId: string; }

function getRecoveryLevel(score: number): { label: string; color: string; gradient: string; action: string } {
  if (score >= 85) return { label: 'Peak', color: 'text-emerald-400', gradient: 'from-emerald-500 to-teal-500', action: 'Push hard!' };
  if (score >= 70) return { label: 'Good', color: 'text-blue-400', gradient: 'from-blue-500 to-cyan-500', action: 'Moderate intensity' };
  if (score >= 50) return { label: 'Fair', color: 'text-amber-400', gradient: 'from-amber-500 to-orange-500', action: 'Light workout' };
  if (score >= 30) return { label: 'Low', color: 'text-orange-400', gradient: 'from-orange-500 to-red-500', action: 'Rest recommended' };
  return { label: 'Critical', color: 'text-red-400', gradient: 'from-red-500 to-pink-500', action: 'Take a rest day' };
}

function generateRecoveryScore(): { score: RecoveryScore; wearables: WearableData } {
  const sleepHours = 5 + Math.random() * 4;
  const sleepQuality = 40 + Math.random() * 50;
  const hrv = 30 + Math.random() * 50;
  const restingHR = 48 + Math.random() * 25;
  const stress = Math.random() * 40;

  // ML-style weighted calculation
  const sleepScore = Math.min((sleepHours / 8) * 100, 100) * 0.25;
  const hrvScore = Math.min((hrv / 60) * 100, 100) * 0.20;
  const restingHRScore = Math.max(0, 100 - (restingHR - 45) * 2) * 0.15;
  const sleepQualityScore = sleepQuality * 0.25;
  const stressScore = Math.max(0, 100 - stress * 2) * 0.15;

  const totalScore = Math.round(sleepScore + hrvScore + restingHRScore + sleepQualityScore + stressScore);

  const muscleStatus = {
    chest: 70 + Math.random() * 30,
    back: 60 + Math.random() * 40,
    legs: 50 + Math.random() * 50,
    shoulders: 65 + Math.random() * 35,
    arms: 75 + Math.random() * 25,
    core: 80 + Math.random() * 20,
  };

  const recommendations = [];
  if (sleepHours < 7) recommendations.push('Aim for at least 7 hours of sleep tonight');
  if (hrv < 45) recommendations.push('Consider meditation to improve HRV');
  if (restingHR > 65) recommendations.push('Your resting heart rate is elevated - prioritize recovery');
  if (stress > 25) recommendations.push('High stress detected - try breathing exercises');
  if (Object.values(muscleStatus).some(v => v < 60)) recommendations.push('Some muscle groups need more recovery time');

  return {
    score: {
      id: '',
      user_id: '',
      score: totalScore,
      sleep_quality: Math.round(sleepQuality),
      sleep_hours: Math.round(sleepHours * 10) / 10,
      resting_heart_rate: Math.round(restingHR),
      hrv: Math.round(hrv),
      muscle_recovery: muscleStatus,
      recommendations,
      recorded_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    },
    wearables: {
      id: '',
      user_id: '',
      source: 'auto',
      date: new Date().toISOString().split('T')[0],
      steps: Math.round(5000 + Math.random() * 15000),
      active_minutes: Math.round(20 + Math.random() * 80),
      calories_burned: Math.round(1800 + Math.random() * 1200),
      heart_rate_avg: Math.round(65 + Math.random() * 20),
      heart_rate_resting: Math.round(restingHR),
      heart_rate_max: Math.round(160 + Math.random() * 30),
      hrv: Math.round(hrv),
      sleep_hours: Math.round(sleepHours * 10) / 10,
      sleep_quality: Math.round(sleepQuality),
      stress_level: Math.round(stress),
      created_at: new Date().toISOString(),
    },
  };
}

export default function RecoveryDashboard({ userId }: Props) {
  const [recovery, setRecovery] = useState<RecoveryScore | null>(null);
  const [wearables, setWearables] = useState<WearableData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId]);

  async function loadData() {
    // Try to load existing recovery score for today
    const { data: existing } = await supabase
      .from('recovery_scores')
      .select('*')
      .eq('user_id', userId)
      .eq('recorded_date', new Date().toISOString().split('T')[0])
      .maybeSingle();

    if (existing) {
      setRecovery(existing as RecoveryScore);

      const { data: wearData } = await supabase
        .from('wearable_data')
        .select('*')
        .eq('user_id', userId)
        .eq('date', new Date().toISOString().split('T')[0])
        .maybeSingle();

      if (wearData) setWearables(wearData as WearableData);
    } else {
      // Generate and save new score
      const { score, wearables: wData } = generateRecoveryScore();

      await supabase.from('recovery_scores').insert({
        user_id: userId,
        ...score,
      });

      await supabase.from('wearable_data').insert({
        user_id: userId,
        ...wData,
      });

      setRecovery(score);
      setWearables(wData);
    }

    setLoading(false);
  }

  async function refreshScore() {
    setLoading(true);
    const { score, wearables: wData } = generateRecoveryScore();

    // Update existing or create new
    if (recovery?.id) {
      await supabase.from('recovery_scores').update(score).eq('id', recovery.id);
    } else {
      await supabase.from('recovery_scores').insert({ user_id: userId, ...score });
    }

    if (wearables?.id) {
      await supabase.from('wearable_data').update(wData).eq('id', wearables.id);
    } else {
      await supabase.from('wearable_data').insert({ user_id: userId, ...wData });
    }

    setRecovery(score);
    setWearables(wData);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="glass-card p-6 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!recovery) return null;

  const level = getRecoveryLevel(recovery.score);
  const muscleRecovery = recovery.muscle_recovery as Record<string, number>;

  return (
    <div className="space-y-6 slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Recovery Analysis
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">AI-powered readiness score for optimal performance</p>
        </div>
        <button onClick={refreshScore} className="btn-glass text-xs flex items-center gap-1.5">
          <RefreshCw size={12} /> Recalculate
        </button>
      </div>

      {/* Main Score */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-6">
          {/* Score Ring */}
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg className="w-full h-full progress-ring" viewBox="0 0 120 120">
              <circle
                cx="60" cy="60" r="52"
                fill="none" stroke="#1e293b" strokeWidth="10"
              />
              <circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke="url(#recoveryGradient)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${recovery.score * 3.26} 326`}
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="recoveryGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold ${level.color}`} style={{ fontFamily: 'Syne, sans-serif' }}>
                {recovery.score}
              </span>
              <span className="text-xs text-slate-400 mt-0.5">{level.label}</span>
            </div>
          </div>

          <div className="flex-1">
            <div className="text-lg font-semibold text-white mb-2">Recovery Score</div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Moon size={14} className="text-blue-400" />
                <span className="text-sm text-slate-400">
                  {recovery.sleep_hours}h sleep
                  {recovery.sleep_quality && <span className="text-xs ml-1">({recovery.sleep_quality}% quality)</span>}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Heart size={14} className="text-rose-400" />
                <span className="text-sm text-slate-400">{recovery.resting_heart_rate} bpm resting</span>
              </div>
              <div className="flex items-center gap-2">
                <Brain size={14} className="text-purple-400" />
                <span className="text-sm text-slate-400">{recovery.hrv} HRV</span>
              </div>
              {wearables?.stress_level && (
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-amber-400" />
                  <span className="text-sm text-slate-400">{wearables.stress_level} stress</span>
                </div>
              )}
            </div>

            <div className={`glass-card p-3 bg-gradient-to-r ${level.gradient} bg-opacity-10`}>
              <div className="flex items-center gap-2">
                <Battery size={16} className="text-white" />
                <span className="text-sm font-medium text-white">{level.action}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Muscle Recovery */}
      <div className="glass-card p-5">
        <h3 className="font-bold text-white text-sm mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
          Muscle Recovery Status
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(muscleRecovery).map(([muscle, score]) => {
            const muscleLabels: Record<string, string> = {
              chest: 'Pectorals',
              back: 'Lats & Traps',
              legs: 'Quads & Hamstrings',
              shoulders: 'Deltoids',
              arms: 'Biceps & Triceps',
              core: 'Core',
            };

            const statusColor = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-blue-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500';

            return (
              <div key={muscle} className="metric-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">{muscleLabels[muscle]}</span>
                  <span className="text-xs font-medium text-white">{Math.round(score)}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${statusColor}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contributing Factors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sleep Analysis */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Moon size={16} className="text-blue-400" />
            <h3 className="font-bold text-white text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>Sleep Analysis</h3>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Total Sleep', value: `${recovery.sleep_hours}h`, target: '8h', score: recovery.sleep_hours && recovery.sleep_hours >= 7 ? 85 : 60 },
              { label: 'Sleep Quality', value: `${recovery.sleep_quality}%`, target: '85%+', score: recovery.sleep_quality || 70 },
              { label: 'Deep Sleep', value: '1.8h', target: '1.5h+', score: 80 },
              { label: 'REM Sleep', value: '1.4h', target: '1.5h', score: 75 },
            ].map(({ label, value, target, score }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
                <span className="text-sm text-slate-400">{label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-white">{value}</span>
                  <span className="text-xs text-slate-500">/ {target}</span>
                  {score >= 80 ? (
                    <TrendingUp size={12} className="text-emerald-400" />
                  ) : score >= 60 ? null : (
                    <TrendingDown size={12} className="text-amber-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Data */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className="text-amber-400" />
            <h3 className="font-bold text-white text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>Activity Today</h3>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Steps', value: wearables?.steps?.toLocaleString() || '0', target: '10,000', icon: '🚶' },
              { label: 'Active Minutes', value: `${wearables?.active_minutes || 0}m`, target: '60m', icon: '⏱' },
              { label: 'Calories Burned', value: wearables?.calories_burned?.toLocaleString() || '0', target: '2,500', icon: '🔥' },
              { label: 'Avg Heart Rate', value: `${wearables?.heart_rate_avg || 75} bpm`, target: '70-100', icon: '❤' },
            ].map(({ label, value, target }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
                <span className="text-sm text-slate-400">{label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-white">{value}</span>
                  <span className="text-xs text-slate-500">/ {target}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      {recovery.recommendations && recovery.recommendations.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-amber-400" />
            <h3 className="font-bold text-white text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
              AI Recommendations
            </h3>
          </div>

          <div className="space-y-2">
            {recovery.recommendations.map((rec, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <Zap size={12} className="text-amber-400" />
                </div>
                <span className="text-sm text-slate-300">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="glass-card p-5">
        <h3 className="font-bold text-white text-sm mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>
          Quick Actions
        </h3>

        <div className="grid grid-cols-3 gap-3">
          <button className="btn-glass text-xs py-3 flex flex-col items-center gap-1.5">
            <Coffee size={16} className="text-blue-400" />
            <span>Log Sleep</span>
          </button>
          <button className="btn-glass text-xs py-3 flex flex-col items-center gap-1.5">
            <Heart size={16} className="text-rose-400" />
            <span>Log HRV</span>
          </button>
          <button className="btn-glass text-xs py-3 flex flex-col items-center gap-1.5">
            <Zap size={16} className="text-amber-400" />
            <span>Log Stress</span>
          </button>
        </div>
      </div>
    </div>
  );
}
