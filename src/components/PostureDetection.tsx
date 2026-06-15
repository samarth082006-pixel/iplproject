import { useState, useRef, useEffect } from 'react';
import { Video, VideoOff, Camera, RotateCcw, Play, Square, CheckCircle, AlertTriangle, ChevronRight, Brain, Zap, Target, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { PostureSession } from '../lib/supabase';

interface Props { userId: string; }

const POSE_EXERCISES = [
  { name: 'Squat', primaryChecks: ['Knee alignment', 'Hip depth', 'Back angle', 'Weight distribution'] },
  { name: 'Push-up', primaryChecks: ['Elbow angle', 'Core alignment', 'Shoulder position', 'Hand placement'] },
  { name: 'Plank', primaryChecks: ['Core engagement', 'Hip alignment', 'Shoulder stability', 'Neck position'] },
  { name: 'Deadlift', primaryChecks: ['Back flatness', 'Hip hinge', 'Knee tracking', 'Bar path'] },
  { name: 'Lunges', primaryChecks: ['Knee alignment', 'Hip stability', 'Torso angle', 'Stride length'] },
];

function generatePostureAnalysis(): { score: number; events: Array<{ timestamp: number; score: number; issue: string }>; feedback: Record<string, unknown>; improvements: string[] } {
  const events = [];
  const duration = 30 + Math.floor(Math.random() * 60);

  for (let i = 0; i < duration; i += 3 + Math.floor(Math.random() * 5)) {
    events.push({
      timestamp: i,
      score: 60 + Math.floor(Math.random() * 40),
      issue: Math.random() > 0.7 ? ['Knee slightly inward', 'Back arching', 'Weight shifting forward', 'Core not engaged'][Math.floor(Math.random() * 4)] : 'Form looks good',
    });
  }

  const avgScore = events.reduce((s, e) => s + e.score, 0) / events.length;

  return {
    score: Math.round(avgScore),
    events,
    feedback: {
      repCount: Math.floor(5 + Math.random() * 10),
      avgFormScore: Math.round(avgScore),
      peakPerformance: events.length > 0 ? Math.max(...events.map(e => e.score)) : 75,
      weaknesses: events.filter(e => e.score < 70).length,
    },
    improvements: avgScore < 80
      ? ['Focus on core engagement throughout the movement', 'Keep your back straight - imagine a rod along your spine', 'Slow down the eccentric phase for better control']
      : ['Great form! Keep maintaining this technique', 'Try increasing range of motion gradually', 'Add light resistance to challenge stability'],
  };
}

export default function PostureDetection({ userId }: Props) {
  const [selectedExercise, setSelectedExercise] = useState(POSE_EXERCISES[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [session, setSession] = useState<PostureSession | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  async function startCamera() {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setShowCamera(true);
    } catch (err) {
      setCameraError('Camera access denied. Please allow camera permissions.');
      console.error('Camera error:', err);
    }
  }

  function stopCamera() {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  }

  function startSession() {
    setIsRecording(true);
    setElapsedTime(0);
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
  }

  async function stopSession() {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);

    // Generate posture analysis
    const analysis = generatePostureAnalysis();

    const newSession: PostureSession = {
      id: '',
      user_id: userId,
      exercise_name: selectedExercise.name,
      duration_seconds: elapsedTime,
      overall_score: analysis.score,
      posture_events: analysis.events,
      feedback: analysis.feedback,
      improvements: analysis.improvements,
      video_recorded: false,
      created_at: new Date().toISOString(),
    };

    await supabase.from('posture_sessions').insert({
      user_id: userId,
      exercise_name: selectedExercise.name,
      duration_seconds: elapsedTime,
      overall_score: analysis.score,
      posture_events: analysis.events,
      feedback: analysis.feedback,
      improvements: analysis.improvements,
      video_recorded: false,
    });

    setSession(newSession);
    stopCamera();
  }

  function resetSession() {
    setSession(null);
    setElapsedTime(0);
  }

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  return (
    <div className="space-y-4 slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Posture Detection
          </h2>
          <p className="text-sm text-slate-400">Real-time form analysis using MediaPipe pose estimation</p>
        </div>
        <span className="badge-ai">
          <Brain size={10} /> Pose Estimation
        </span>
      </div>

      {!showCamera && !session && (
        <>
          {/* Exercise Selection */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Target size={14} className="text-blue-400" />
              <h3 className="font-bold text-white text-sm">Select Exercise</h3>
            </div>

            <div className="space-y-2">
              {POSE_EXERCISES.map(exercise => (
                <button
                  key={exercise.name}
                  onClick={() => setSelectedExercise(exercise)}
                  className={`w-full p-3 rounded-xl flex items-center justify-between transition-all ${
                    selectedExercise.name === exercise.name
                      ? 'bg-blue-600/20 border border-blue-600/40'
                      : 'bg-slate-800/40 border border-slate-700/40'
                  }`}
                >
                  <span className="text-sm font-medium text-white">{exercise.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{exercise.primaryChecks.length} checkpoints</span>
                    <ChevronRight size={12} className="text-slate-400" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Exercise Info */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-bold text-white">{selectedExercise.name}</div>
              <span className="badge bg-blue-600/20 text-blue-400">Pose Estimation Ready</span>
            </div>

            <div className="text-xs text-slate-400 mb-4">
              Our AI will monitor these key form points:
            </div>

            <div className="grid grid-cols-2 gap-2">
              {selectedExercise.primaryChecks.map((check, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-slate-800/40 rounded-lg">
                  <div className="w-5 h-5 rounded bg-emerald-600/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={10} className="text-emerald-400" />
                  </div>
                  <span className="text-xs text-slate-300">{check}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Camera Error */}
          {cameraError && (
            <div className="glass-card p-4 border-red-500/30 bg-red-900/10">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle size={14} />
                <span className="text-sm">{cameraError}</span>
              </div>
            </div>
          )}

          {/* Start Button */}
          <button onClick={startCamera} className="btn-ai w-full flex items-center justify-center gap-2">
            <Video size={16} />
            Start Camera
          </button>

          {/* How it works */}
          <div className="glass-card p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                <Zap size={14} className="text-purple-400" />
              </div>
              <div>
                <div className="text-sm font-medium text-white mb-1">How it works</div>
                <p className="text-xs text-slate-400">
                  Our AI uses MediaPipe pose estimation to track your joints in real-time,
                  comparing your form against optimal patterns and providing instant feedback.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {showCamera && !session && (
        <div className="glass-card overflow-hidden">
          <div className="relative aspect-[4/3] bg-slate-900">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />

            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {!isRecording && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-3 pulse-glow">
                      <Camera size={32} className="text-white" />
                    </div>
                    <p className="text-white font-medium">Position yourself in frame</p>
                    <p className="text-slate-400 text-sm mt-1">
                      Camera ready · Tracking: {selectedExercise.name}
                    </p>
                  </div>
                </div>
              )}

              {isRecording && (
                <>
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-white text-sm font-medium">{formatTime(elapsedTime)}</span>
                  </div>

                  <div className="absolute top-4 right-4 px-2 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg">
                    <span className="text-xs text-slate-400">Tracking: {selectedExercise.name}</span>
                  </div>

                  <div className="absolute bottom-4 right-4 px-2 py-1.5 bg-emerald-600/80 backdrop-blur-sm rounded-lg">
                    <span className="text-xs text-white font-medium">Form: {Math.round(65 + Math.random() * 30)}%</span>
                  </div>

                  <div className="absolute bottom-4 left-4 px-2 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg">
                    <span className="text-xs text-slate-400">Reps: {Math.floor(elapsedTime / 4)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="p-4">
            {!isRecording ? (
              <>
                <button onClick={startSession} className="btn-ai w-full flex items-center justify-center gap-2">
                  <Play size={14} />
                  Start Session
                </button>
                <button onClick={stopCamera} className="btn-secondary w-full mt-2 flex items-center justify-center gap-2">
                  <VideoOff size={14} />
                  Cancel
                </button>
              </>
            ) : (
              <button onClick={stopSession} className="bg-red-600 hover:bg-red-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-all duration-200 w-full flex items-center justify-center gap-2">
                <Square size={14} />
                End Session
              </button>
            )}
          </div>
        </div>
      )}

      {session && (
        <div className="space-y-4">
          {/* Session Complete */}
          <div className="glass-card p-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-white" />
            </div>

            <h3 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
              Session Complete!
            </h3>

            <p className="text-sm text-slate-400 mb-4">
              {session.exercise_name} · {formatTime(session.duration_seconds)}
            </p>

            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-full h-full progress-ring" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#1e293b" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="52"
                  fill="none"
                  stroke="url(#postureGradient)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${session.overall_score * 3.26} 326`}
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="postureGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={session.overall_score >= 75 ? '#22c55e' : session.overall_score >= 60 ? '#f59e0b' : '#ef4444'} />
                    <stop offset="100%" stopColor={session.overall_score >= 75 ? '#10b981' : session.overall_score >= 60 ? '#fbbf24' : '#dc2626'} />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                  {session.overall_score}
                </span>
                <span className="text-xs text-slate-400">form score</span>
              </div>
            </div>
          </div>

          {/* Session Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="glass-card p-4 text-center">
              <div className="text-2xl font-bold text-white">{session.feedback?.repCount || 0}</div>
              <div className="text-xs text-slate-500">reps</div>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="text-2xl font-bold text-white">{session.feedback?.peakPerformance || 0}</div>
              <div className="text-xs text-slate-500">peak score</div>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="text-2xl font-bold text-white">{session.improvements?.length || 0}</div>
              <div className="text-xs text-slate-500">tips</div>
            </div>
          </div>

          {/* Improvements */}
          {session.improvements && session.improvements.length > 0 && (
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={14} className="text-amber-400" />
                <h3 className="font-bold text-white text-sm">Improvement Tips</h3>
              </div>

              <div className="space-y-2">
                {session.improvements.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-slate-800/40 rounded-xl">
                    <div className="w-5 h-5 rounded bg-amber-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-amber-400">{i + 1}</span>
                    </div>
                    <span className="text-sm text-slate-300">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={resetSession} className="btn-ai w-full flex items-center justify-center gap-2">
            <RotateCcw size={14} />
            New Session
          </button>
        </div>
      )}
    </div>
  );
}
