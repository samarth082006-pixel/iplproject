import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  date_of_birth: string | null;
  fitness_level: string;
  primary_goal: string;
  created_at: string;
  updated_at: string;
};

export type Exercise = {
  id: string;
  name: string;
  category: string;
  muscle_groups: string[];
  description: string | null;
  is_custom: boolean;
  created_by: string | null;
  created_at: string;
};

export type WorkoutExercise = {
  id: string;
  workout_id: string;
  exercise_id: string | null;
  exercise_name: string;
  sets: number;
  reps: number | null;
  weight_kg: number | null;
  duration_seconds: number | null;
  distance_km: number | null;
  notes: string;
  order_index: number;
  created_at: string;
};

export type Workout = {
  id: string;
  user_id: string;
  name: string;
  notes: string;
  duration_minutes: number;
  calories_burned: number;
  workout_date: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
  workout_exercises?: WorkoutExercise[];
};

export type NutritionLog = {
  id: string;
  user_id: string;
  food_name: string;
  meal_type: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  serving_size: string;
  log_date: string;
  created_at: string;
};

export type Goal = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  goal_type: string;
  target_value: number | null;
  current_value: number;
  unit: string;
  target_date: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

export type BodyMetric = {
  id: string;
  user_id: string;
  weight_kg: number | null;
  body_fat_percent: number | null;
  muscle_mass_kg: number | null;
  waist_cm: number | null;
  chest_cm: number | null;
  hips_cm: number | null;
  recorded_date: string;
  notes: string;
  created_at: string;
};

// AI Feature Types
export type AIChatMessage = {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  context: Record<string, unknown>;
  created_at: string;
};

export type WorkoutRecommendation = {
  id: string;
  user_id: string;
  recommendation_type: string;
  suggested_workout: Record<string, unknown>;
  reason: string;
  confidence_score: number;
  based_on: Record<string, unknown>;
  valid_until: string | null;
  accepted: boolean;
  created_at: string;
};

export type RecoveryScore = {
  id: string;
  user_id: string;
  score: number;
  sleep_quality: number | null;
  sleep_hours: number | null;
  resting_heart_rate: number | null;
  hrv: number | null;
  muscle_recovery: Record<string, unknown>;
  recommendations: string[];
  recorded_date: string;
  created_at: string;
};

export type FoodScan = {
  id: string;
  user_id: string;
  image_url: string | null;
  detected_foods: Array<{ name: string; calories: number; protein: number; carbs: number; fat: number; confidence: number }>;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  confidence: number;
  user_confirmed: boolean;
  log_to_nutrition: boolean;
  created_at: string;
};

export type ConsistencyPrediction = {
  id: string;
  user_id: string;
  prediction_date: string;
  weekly_probability: number;
  monthly_probability: number;
  streak_risk: 'low' | 'medium' | 'high';
  factors: Record<string, unknown>;
  recommended_actions: string[];
  optimal_workout_times: Array<{ day: string; time: string; score: number }>;
  created_at: string;
};

export type CaloriePrediction = {
  id: string;
  user_id: string;
  workout_type: string;
  predicted_calories: number;
  intensity: string;
  duration_minutes: number | null;
  estimated_heart_rate_avg: number | null;
  estimated_heart_rate_max: number | null;
  model_confidence: number;
  actual_calories: number | null;
  created_at: string;
};

export type PostureSession = {
  id: string;
  user_id: string;
  exercise_name: string;
  duration_seconds: number;
  overall_score: number;
  posture_events: Array<{ timestamp: number; score: number; issue: string }>;
  feedback: Record<string, unknown>;
  improvements: string[];
  video_recorded: boolean;
  created_at: string;
};

export type WearableData = {
  id: string;
  user_id: string;
  source: string;
  date: string;
  steps: number;
  active_minutes: number;
  calories_burned: number;
  heart_rate_avg: number | null;
  heart_rate_resting: number | null;
  heart_rate_max: number | null;
  hrv: number | null;
  sleep_hours: number | null;
  sleep_quality: number | null;
  stress_level: number | null;
  created_at: string;
};
