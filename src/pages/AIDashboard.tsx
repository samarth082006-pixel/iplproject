import { useState } from 'react';
import { Brain, MessageCircle, Dumbbell, Battery, Camera, TrendingUp, Flame, User, ChevronRight, Sparkles, Zap } from 'lucide-react';
import AICoach from '../components/AICoach';
import SmartRecommendations from '../components/SmartRecommendations';
import RecoveryDashboard from '../components/RecoveryDashboard';
import FoodScanner from '../components/FoodScanner';
import ConsistencyPredictor from '../components/ConsistencyPredictor';
import PostureDetection from '../components/PostureDetection';
import CaloriePredictor from '../components/CaloriePredictor';

interface Props { userId: string; }

type AIPage = 'overview' | 'coach' | 'recommendations' | 'recovery' | 'scanner' | 'consistency' | 'posture' | 'calories';

const AI_MODULES = [
  { id: 'coach', label: 'AI Coach', desc: 'Chat with your fitness assistant', icon: MessageCircle, gradient: 'from-blue-500 to-cyan-500', badge: 'GPT-4' },
  { id: 'recommendations', label: 'Smart Workouts', desc: 'Personalized workout suggestions', icon: Dumbbell, gradient: 'from-orange-500 to-pink-500', badge: 'ML v2.1' },
  { id: 'recovery', label: 'Recovery Score', desc: 'Daily readiness analysis', icon: Battery, gradient: 'from-emerald-500 to-teal-500', badge: 'Biometric' },
  { id: 'scanner', label: 'Food Scanner', desc: 'Scan meals for nutrition data', icon: Camera, gradient: 'from-purple-500 to-pink-500', badge: 'Vision' },
  { id: 'consistency', label: 'Consistency', desc: 'Predict adherence & get reminders', icon: TrendingUp, gradient: 'from-blue-500 to-indigo-500', badge: 'Predictive' },
  { id: 'posture', label: 'Posture Detection', desc: 'Real-time form analysis', icon: User, gradient: 'from-rose-500 to-orange-500', badge: 'MediaPipe' },
  { id: 'calories', label: 'Calorie Predictor', desc: 'Estimate burn with ML', icon: Flame, gradient: 'from-amber-500 to-red-500', badge: 'ML Model' },
];

export default function AIDashboard({ userId }: Props) {
  const [activePage, setActivePage] = useState<AIPage>('overview');

  function renderContent() {
    switch (activePage) {
      case 'coach':
        return <AICoach userId={userId} />;
      case 'recommendations':
        return <SmartRecommendations userId={userId} />;
      case 'recovery':
        return <RecoveryDashboard userId={userId} />;
      case 'scanner':
        return <FoodScanner userId={userId} onScanComplete={() => setActivePage('overview')} />;
      case 'consistency':
        return <ConsistencyPredictor userId={userId} />;
      case 'posture':
        return <PostureDetection userId={userId} />;
      case 'calories':
        return <CaloriePredictor userId={userId} />;
      default:
        return renderOverview();
    }
  }

  function renderOverview() {
    return (
      <div className="space-y-6 slide-up">
        {/* AI Hero */}
        <div className="glass-card p-6 relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />

          <div className="relative flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 pulse-glow">
              <Brain size={28} className="text-white" />
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
                AI-Powered Fitness
              </h1>
              <p className="text-sm text-slate-400 leading-relaxed">
                Access cutting-edge ML features for smarter training, better nutrition, and optimal recovery.
              </p>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <span className="badge-ai">
                <Sparkles size={10} /> 7 AI Features
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'AI Chats', value: '12', icon: MessageCircle, color: 'from-blue-500 to-cyan-500' },
            { label: 'Sessions', value: '8', icon: Dumbbell, color: 'from-orange-500 to-pink-500' },
            { label: 'Scans', value: '5', icon: Camera, color: 'from-purple-500 to-pink-500' },
            { label: 'Predictions', value: '15', icon: TrendingUp, color: 'from-emerald-500 to-teal-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="glass-card glass-card-hover p-4">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-2`}>
                <Icon size={14} className="text-white" />
              </div>
              <div className="text-lg font-bold text-white">{value}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          ))}
        </div>

        {/* AI Modules */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-blue-400" />
            <h2 className="font-bold text-white text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
              AI Features
            </h2>
          </div>

          {AI_MODULES.map(module => {
            const Icon = module.icon;
            return (
              <button
                key={module.id}
                onClick={() => setActivePage(module.id as AIPage)}
                className="glass-card glass-card-hover p-4 w-full text-left flex items-center gap-4 group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${module.gradient} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105`}>
                  <Icon size={18} className="text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-white">{module.label}</span>
                    <span className="badge bg-slate-700 text-slate-400 text-xs">{module.badge}</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{module.desc}</p>
                </div>

                <ChevronRight size={16} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
              </button>
            );
          })}
        </div>

        {/* Recent AI Activity */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain size={14} className="text-purple-400" />
              <h3 className="font-bold text-white text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
                Recent AI Activity
              </h3>
            </div>
            <span className="text-xs text-slate-500">Last 7 days</span>
          </div>

          <div className="space-y-2">
            {[
              { action: 'Received workout recommendation', time: '2h ago', type: 'recs' },
              { action: 'Scanned meal for nutrition', time: '5h ago', type: 'scan' },
              { action: 'Analyzed recovery score', time: '1d ago', type: 'recovery' },
              { action: 'Chatted with AI coach', time: '2d ago', type: 'chat' },
            ].map(({ action, time, type }, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 bg-slate-800/40 rounded-lg">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  type === 'recs' ? 'bg-orange-600/20' :
                  type === 'scan' ? 'bg-purple-600/20' :
                  type === 'recovery' ? 'bg-emerald-600/20' : 'bg-blue-600/20'
                }`}>
                  <Zap size={12} className={
                    type === 'recs' ? 'text-orange-400' :
                    type === 'scan' ? 'text-purple-400' :
                    type === 'recovery' ? 'text-emerald-400' : 'text-blue-400'
                  } />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-slate-300">{action}</div>
                  <div className="text-xs text-slate-500">{time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ML Model Info */}
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Brain size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="text-xs text-slate-400">Powered by</div>
            <div className="text-sm font-medium text-white">TensorFlow Lite, MediaPipe & OpenAI</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">Model Version</div>
            <div className="text-sm font-medium text-blue-400">v2.1.0</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        {activePage !== 'overview' && (
          <button
            onClick={() => setActivePage('overview')}
            className="btn-glass text-xs py-1.5 px-2.5"
          >
            Back to Overview
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {renderContent()}
      </div>
    </div>
  );
}
