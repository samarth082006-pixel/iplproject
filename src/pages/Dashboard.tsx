import { useEffect, useState } from 'react';
import { Dumbbell, Flame, Apple, Target, TrendingUp, Award, Calendar, ChevronRight, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Workout, NutritionLog, Goal } from '../lib/supabase';

interface Props {
  userId: string;
  onNavigate: (page: 'workouts' | 'nutrition' | 'goals' | 'progress') => void;
}

export default function Dashboard({ userId, onNavigate }: Props) {
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([]);
  const [todayNutrition, setTodayNutrition] = useState<NutritionLog[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState<{ day: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    async function load() {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const [workoutsRes, nutritionRes, goalsRes] = await Promise.all([
        supabase
          .from('workouts')
          .select('*')
          .eq('user_id', userId)
          .gte('workout_date', sevenDaysAgo)
          .order('workout_date', { ascending: false })
          .limit(10),
        supabase
          .from('nutrition_logs')
          .select('*')
          .eq('user_id', userId)
          .eq('log_date', today),
        supabase
          .from('goals')
          .select('*')
          .eq('user_id', userId)
          .eq('completed', false)
          .order('created_at', { ascending: false })
          .limit(4),
      ]);

      const workouts = workoutsRes.data || [];
      setRecentWorkouts(workouts.slice(0, 3));
      setTodayNutrition(nutritionRes.data || []);
      setGoals(goalsRes.data || []);

      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const counts = days.map((day, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (d.getDay() - i + 7) % 7);
        const dateStr = d.toISOString().split('T')[0];
        return {
          day,
          count: workouts.filter(w => w.workout_date === dateStr).length,
        };
      });
      setWeeklyWorkouts(counts);
      setLoading(false);
    }
    load();
  }, [userId, today]);

  const totalCalories = todayNutrition.reduce((sum, n) => sum + n.calories, 0);
  const totalProtein = todayNutrition.reduce((sum, n) => sum + n.protein_g, 0);
  const totalCarbs = todayNutrition.reduce((sum, n) => sum + n.carbs_g, 0);
  const totalFat = todayNutrition.reduce((sum, n) => sum + n.fat_g, 0);

  const weeklyCount = recentWorkouts.length;
  const totalCaloriesBurned = recentWorkouts.reduce((sum, w) => sum + w.calories_burned, 0);
  const totalDuration = recentWorkouts.reduce((sum, w) => sum + w.duration_minutes, 0);
  const streak = weeklyCount >= 3 ? weeklyCount : 0;

  const maxCount = Math.max(...weeklyWorkouts.map(d => d.count), 1);

  const calorieGoal = 2000;
  const proteinGoal = 150;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
          <Zap size={15} className="text-amber-400" />
          <span className="text-amber-400 text-sm font-semibold">{streak} day streak</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Workouts This Week', value: weeklyCount, icon: Dumbbell, color: 'blue', unit: 'sessions' },
          { label: 'Calories Burned', value: totalCaloriesBurned.toLocaleString(), icon: Flame, color: 'orange', unit: 'kcal' },
          { label: "Today's Calories", value: totalCalories.toLocaleString(), icon: Apple, color: 'green', unit: `/ ${calorieGoal} kcal` },
          { label: 'Active Goals', value: goals.length, icon: Target, color: 'cyan', unit: 'in progress' },
        ].map(({ label, value, icon: Icon, color, unit }) => {
          const colorMap: Record<string, string> = {
            blue: 'bg-blue-600/20 text-blue-400',
            orange: 'bg-orange-600/20 text-orange-400',
            green: 'bg-emerald-600/20 text-emerald-400',
            cyan: 'bg-cyan-600/20 text-cyan-400',
          };
          return (
            <div key={label} className="card p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[color]}`}>
                <Icon size={18} />
              </div>
              <div className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{unit}</div>
              <div className="text-xs text-slate-400 mt-1">{label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5 col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-white text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>Weekly Activity</h3>
            <span className="text-xs text-slate-500">{totalDuration} min total</span>
          </div>
          <div className="flex items-end gap-2 h-28">
            {weeklyWorkouts.map(({ day, count }) => {
              const height = count > 0 ? Math.max((count / maxCount) * 100, 20) : 0;
              const isToday = day === ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full flex items-end justify-center" style={{ height: '88px' }}>
                    {count > 0 ? (
                      <div
                        className={`w-full rounded-t-lg transition-all duration-500 ${isToday ? 'bg-blue-500' : 'bg-blue-600/40'}`}
                        style={{ height: `${height}%` }}
                      />
                    ) : (
                      <div className="w-full h-1 bg-slate-800 rounded" />
                    )}
                  </div>
                  <span className={`text-xs ${isToday ? 'text-blue-400 font-semibold' : 'text-slate-600'}`}>{day}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>Today's Nutrition</h3>
            <button onClick={() => onNavigate('nutrition')} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-0.5">
              Log food <ChevronRight size={12} />
            </button>
          </div>

          <div className="flex items-center justify-center mb-4">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="#1e293b" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15" fill="none"
                  stroke="#3b82f6" strokeWidth="3"
                  strokeDasharray={`${Math.min((totalCalories / calorieGoal) * 94, 94)} 94`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-white leading-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
                  {totalCalories}
                </span>
                <span className="text-xs text-slate-500">kcal</span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {[
              { label: 'Protein', value: totalProtein, goal: proteinGoal, color: 'bg-blue-500', unit: 'g' },
              { label: 'Carbs', value: totalCarbs, goal: 250, color: 'bg-amber-500', unit: 'g' },
              { label: 'Fat', value: totalFat, goal: 65, color: 'bg-rose-500', unit: 'g' },
            ].map(({ label, value, goal, color, unit }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">{label}</span>
                  <span className="text-slate-300">{Math.round(value)}{unit} / {goal}{unit}</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${color}`}
                    style={{ width: `${Math.min((value / goal) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>Recent Workouts</h3>
            <button onClick={() => onNavigate('workouts')} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-0.5">
              View all <ChevronRight size={12} />
            </button>
          </div>
          {recentWorkouts.length === 0 ? (
            <div className="text-center py-8">
              <Dumbbell size={28} className="text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No workouts this week</p>
              <button onClick={() => onNavigate('workouts')} className="btn-primary mt-3 text-xs px-3 py-2">
                Log a workout
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentWorkouts.map(workout => (
                <div key={workout.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                  <div className="w-9 h-9 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Dumbbell size={16} className="text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{workout.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {new Date(workout.workout_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {workout.duration_minutes > 0 && ` · ${workout.duration_minutes} min`}
                    </div>
                  </div>
                  {workout.calories_burned > 0 && (
                    <div className="flex items-center gap-1 text-orange-400 text-xs font-medium">
                      <Flame size={12} />
                      {workout.calories_burned}
                    </div>
                  )}
                  <div className={`w-2 h-2 rounded-full ${workout.completed ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>Active Goals</h3>
            <button onClick={() => onNavigate('goals')} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-0.5">
              Manage <ChevronRight size={12} />
            </button>
          </div>
          {goals.length === 0 ? (
            <div className="text-center py-8">
              <Target size={28} className="text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No active goals</p>
              <button onClick={() => onNavigate('goals')} className="btn-primary mt-3 text-xs px-3 py-2">
                Set a goal
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map(goal => {
                const pct = goal.target_value
                  ? Math.min((goal.current_value / goal.target_value) * 100, 100)
                  : 0;
                return (
                  <div key={goal.id} className="p-3 bg-slate-800/50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Award size={14} className="text-cyan-400" />
                        <span className="text-sm font-medium text-white truncate max-w-[160px]">{goal.title}</span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">{Math.round(pct)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {goal.target_value && (
                      <div className="text-xs text-slate-500 mt-1.5">
                        {goal.current_value} / {goal.target_value} {goal.unit}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-bold text-white text-sm mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Log Workout', icon: Dumbbell, page: 'workouts' as const, color: 'text-blue-400 bg-blue-600/10 hover:bg-blue-600/20 border-blue-600/20' },
            { label: 'Track Meal', icon: Apple, page: 'nutrition' as const, color: 'text-emerald-400 bg-emerald-600/10 hover:bg-emerald-600/20 border-emerald-600/20' },
            { label: 'Set Goal', icon: Target, page: 'goals' as const, color: 'text-cyan-400 bg-cyan-600/10 hover:bg-cyan-600/20 border-cyan-600/20' },
            { label: 'View Progress', icon: TrendingUp, page: 'progress' as const, color: 'text-amber-400 bg-amber-600/10 hover:bg-amber-600/20 border-amber-600/20' },
          ].map(({ label, icon: Icon, page, color }) => (
            <button
              key={label}
              onClick={() => onNavigate(page)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${color}`}
            >
              <Icon size={20} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {goals.some(g => g.target_date) && (
        <div className="card p-5">
          <h3 className="font-bold text-white text-sm mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>Upcoming Deadlines</h3>
          <div className="space-y-2">
            {goals
              .filter(g => g.target_date)
              .sort((a, b) => new Date(a.target_date!).getTime() - new Date(b.target_date!).getTime())
              .slice(0, 3)
              .map(goal => {
                const daysLeft = Math.ceil((new Date(goal.target_date!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={goal.id} className="flex items-center gap-3 p-2.5 bg-slate-800/40 rounded-lg">
                    <Calendar size={14} className="text-slate-500 flex-shrink-0" />
                    <span className="text-sm text-slate-300 flex-1 truncate">{goal.title}</span>
                    <span className={`text-xs font-medium ${daysLeft <= 7 ? 'text-amber-400' : 'text-slate-500'}`}>
                      {daysLeft <= 0 ? 'Overdue' : `${daysLeft}d left`}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
