/*
  # FitFuel AI-Powered Features Schema

  ## New Tables
  1. `ai_chat_history` - Chat messages with AI coach
  2. `workout_recommendations` - AI-generated workout suggestions
  3. `recovery_scores` - Daily recovery predictions
  4. `food_scans` - Food image recognition results
  5. `consistency_predictions` - Workout consistency forecasts
  6. `calorie_predictions` - AI calorie burn predictions
  7. `posture_sessions` - Exercise posture detection sessions

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
*/

-- AI Chat History
CREATE TABLE IF NOT EXISTS ai_chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  context jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat history"
  ON ai_chat_history FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
  ON ai_chat_history FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat history"
  ON ai_chat_history FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Workout Recommendations
CREATE TABLE IF NOT EXISTS workout_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_type text NOT NULL,
  suggested_workout jsonb NOT NULL,
  reason text DEFAULT '',
  confidence_score numeric DEFAULT 0,
  based_on jsonb DEFAULT '{}',
  valid_until timestamptz,
  accepted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workout_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recommendations"
  ON workout_recommendations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recommendations"
  ON workout_recommendations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recommendations"
  ON workout_recommendations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Recovery Scores
CREATE TABLE IF NOT EXISTS recovery_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score >= 0 AND score <= 100),
  sleep_quality integer,
  sleep_hours numeric,
  resting_heart_rate integer,
  hrv numeric,
  muscle_recovery jsonb DEFAULT '{}',
  recommendations text[] DEFAULT '{}',
  recorded_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recovery_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recovery scores"
  ON recovery_scores FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recovery scores"
  ON recovery_scores FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Food Scans
CREATE TABLE IF NOT EXISTS food_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url text,
  detected_foods jsonb DEFAULT '[]',
  total_calories integer DEFAULT 0,
  total_protein numeric DEFAULT 0,
  total_carbs numeric DEFAULT 0,
  total_fat numeric DEFAULT 0,
  confidence numeric DEFAULT 0,
  user_confirmed boolean DEFAULT false,
  log_to_nutrition boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE food_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own food scans"
  ON food_scans FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own food scans"
  ON food_scans FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own food scans"
  ON food_scans FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Consistency Predictions
CREATE TABLE IF NOT EXISTS consistency_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prediction_date date DEFAULT CURRENT_DATE,
  weekly_probability numeric NOT NULL,
  monthly_probability numeric NOT NULL,
  streak_risk text DEFAULT 'low',
  factors jsonb DEFAULT '{}',
  recommended_actions text[] DEFAULT '{}',
  optimal_workout_times jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE consistency_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consistency predictions"
  ON consistency_predictions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consistency predictions"
  ON consistency_predictions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Calorie Predictions
CREATE TABLE IF NOT EXISTS calorie_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_type text NOT NULL,
  predicted_calories integer NOT NULL,
  intensity text DEFAULT 'moderate',
  duration_minutes integer,
  estimated_heart_rate_avg integer,
  estimated_heart_rate_max integer,
  model_confidence numeric DEFAULT 0,
  actual_calories integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE calorie_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own calorie predictions"
  ON calorie_predictions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calorie predictions"
  ON calorie_predictions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calorie predictions"
  ON calorie_predictions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Posture Sessions
CREATE TABLE IF NOT EXISTS posture_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_name text NOT NULL,
  duration_seconds integer DEFAULT 0,
  overall_score integer DEFAULT 0,
  posture_events jsonb DEFAULT '[]',
  feedback jsonb DEFAULT '{}',
  improvements text[] DEFAULT '{}',
  video_recorded boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE posture_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own posture sessions"
  ON posture_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own posture sessions"
  ON posture_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- User device/wearable data
CREATE TABLE IF NOT EXISTS wearable_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source text DEFAULT 'manual',
  date date DEFAULT CURRENT_DATE,
  steps integer DEFAULT 0,
  active_minutes integer DEFAULT 0,
  calories_burned integer DEFAULT 0,
  heart_rate_avg integer,
  heart_rate_resting integer,
  heart_rate_max integer,
  hrv numeric,
  sleep_hours numeric,
  sleep_quality integer,
  stress_level integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wearable_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wearable data"
  ON wearable_data FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wearable data"
  ON wearable_data FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wearable data"
  ON wearable_data FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
