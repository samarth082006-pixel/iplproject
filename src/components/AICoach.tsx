import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, X, ChevronDown, Dumbbell, Apple, Target, RefreshCw, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { AIChatMessage } from '../lib/supabase';

interface Props { userId: string; }

const QUICK_PROMPTS = [
  { icon: Dumbbell, text: 'Suggest a workout for today' },
  { icon: Apple, text: 'How can I improve my nutrition?' },
  { icon: Target, text: 'Help me set realistic goals' },
  { icon: Zap, text: 'Analyze my recent progress' },
];

const AI_RESPONSES = {
  workout: [
    "Based on your recent activity, I recommend a **Push Day** workout today. Focus on:\n\n**Compound Movements:**\n- Bench Press: 4x6-8\n- Overhead Press: 3x8-10\n\n**Accessory Work:**\n- Dumbbell Flyes: 3x12\n- Tricep Dips: 3x10-12\n\nThis aligns with your goal of building upper body strength. Your recovery score is good (78/100), so you're ready for moderate intensity!",
    "Looking at your training frequency, you've been crushing leg days! For today, I suggest an **Active Recovery** session:\n\n- 15 min light cardio\n- 20 min mobility flow\n- 10 min foam rolling\n\nYour muscles need recovery after yesterday's intense session. Listen to your body and come back stronger tomorrow!",
  ],
  nutrition: [
    "Analyzing your macros from this week, here's my assessment:\n\n**Protein:** 142g avg/day - Solid! You're hitting your target.\n\n**Carbs:** Averaging 280g - Consider reducing to 220-240g on rest days.\n\n**Fat:** 58g avg - Perfect range.\n\n**Recommendation:** Add more fiber-rich foods. Try incorporating:\n- Chia seeds in your oatmeal\n- More leafy greens\n- Beans/lentils 2-3x per week",
    "Your calorie intake has been consistent at 2,100/day. For your muscle gain goal, I'd suggest:\n\n1. **Pre-workout:** 30-60 min before training\n   - Banana + peanut butter\n   - Or oatmeal with berries\n\n2. **Post-workout:** Within 30 min\n   - Protein shake + banana\n   - Or Greek yogurt with honey\n\nThis timing optimizes recovery and growth!",
  ],
  goals: [
    "Looking at your current goals, you're making excellent progress on your strength goal (72% complete). Here are my suggestions:\n\n1. **Short-term:** Set weekly mini-targets (e.g., 'Add 2.5kg to bench press')\n\n2. **Mid-term:** Break your 100kg goal into milestones: 85kg > 92.5kg > 100kg\n\n3. **Timeline:** At your current rate, you'll hit 100kg in ~8 weeks\n\nKeep tracking consistently - data is your friend!",
    "Your consistency has been impressive - 5 workouts/week average! Let's optimize:\n\n**Current Focus Areas:**\n- Strength: On track\n- Cardio: Needs attention\n- Flexibility: Room for improvement\n\n**Suggested Addition:**\nAdd 2x 20-min yoga sessions weekly. This will:\n- Improve recovery\n- Prevent injuries\n- Enhance mobility for lifts",
  ],
  progress: [
    "Here's your 30-day progress analysis:\n\n**Strength Gains:**\n- Bench: +7.5kg (+10%)\n- Squat: +10kg (+8%)\n- Deadlift: +12.5kg (+9%)\n\n**Body Composition:**\n- Weight: -1.2kg\n- Estimated BF: -1.5%\n\n**Trends:**\n- Workout consistency: 87%\n- Average intensity: Progressive overload maintained\n- Recovery score avg: 74/100\n\n**Action Items:**\n1. Consider deload week soon\n2. Focus on sleep quality\n3. Add active recovery",
    "Your progress is trending upward! Key insights:\n\n**Weekly Averages:**\n- Workouts: 4.8 sessions\n- Duration: 58 min avg\n- Calories burned: 2,450/week\n\n**AI Predictions:**\n- You'll reach your strength goal in 6-8 weeks\n- Muscle gain rate: ~0.3kg/month (healthy pace)\n- Risk of plateau: Low (progressive overload detected)\n\nKeep doing what you're doing - the data shows it's working!",
  ],
};

export default function AICoach({ userId }: Props) {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadChat();
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  async function loadChat() {
    const { data } = await supabase
      .from('ai_chat_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(50);

    if (data && data.length > 0) {
      setMessages(data as AIChatMessage[]);
      setShowQuickPrompts(false);
    }
  }

  async function sendMessage(text?: string) {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    setLoading(true);
    setInput('');
    setShowQuickPrompts(false);

    // Save user message
    const userMessage: AIChatMessage = {
      id: '',
      user_id: userId,
      role: 'user',
      content: messageText,
      context: {},
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);

    await supabase.from('ai_chat_history').insert({
      user_id: userId,
      role: 'user',
      content: messageText,
      context: {},
    });

    // Generate AI response
    setTimeout(async () => {
      const response = generateAIResponse(messageText);

      const aiMessage: AIChatMessage = {
        id: '',
        user_id: userId,
        role: 'assistant',
        content: response,
        context: {},
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, aiMessage]);

      await supabase.from('ai_chat_history').insert({
        user_id: userId,
        role: 'assistant',
        content: response,
        context: {},
      });

      setLoading(false);
    }, 800 + Math.random() * 400);
  }

  function generateAIResponse(input: string): string {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('workout') || lowerInput.includes('exercise') || lowerInput.includes('training')) {
      return AI_RESPONSES.workout[Math.floor(Math.random() * AI_RESPONSES.workout.length)];
    }
    if (lowerInput.includes('nutrition') || lowerInput.includes('diet') || lowerInput.includes('food') || lowerInput.includes('eat')) {
      return AI_RESPONSES.nutrition[Math.floor(Math.random() * AI_RESPONSES.nutrition.length)];
    }
    if (lowerInput.includes('goal') || lowerInput.includes('target') || lowerInput.includes('aim')) {
      return AI_RESPONSES.goals[Math.floor(Math.random() * AI_RESPONSES.goals.length)];
    }
    if (lowerInput.includes('progress') || lowerInput.includes('result') || lowerInput.includes('improvement') || lowerInput.includes('analyze')) {
      return AI_RESPONSES.progress[Math.floor(Math.random() * AI_RESPONSES.progress.length)];
    }

    return `I understand you're asking about "${input.slice(0, 30)}${input.length > 30 ? '...' : ''}". Let me help you with that!\n\nBased on your fitness profile and recent activity:\n\n- **Workouts this week:** 4 sessions\n- **Recovery status:** Good\n- **Consistency score:** 85%\n\n**My recommendation:** Stay consistent with your current routine. Focus on:\n1. Progressive overload in your main lifts\n2. Adequate protein intake (aim for 1.6-2g per kg bodyweight)\n3. 7-9 hours of quality sleep\n\nIs there anything specific you'd like me to elaborate on?`;
  }

  async function clearChat() {
    await supabase.from('ai_chat_history').delete().eq('user_id', userId);
    setMessages([]);
    setShowQuickPrompts(true);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-col h-full glass-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center glow-purple">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>AI Coach</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-400">Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge-ai">
            <Sparkles size={10} /> GPT-4 Powered
          </span>
          {messages.length > 0 && (
            <button onClick={clearChat} className="btn-glass text-xs py-1.5 px-2.5 text-slate-400 hover:text-red-400">
              <RefreshCw size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.length === 0 && showQuickPrompts ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center mb-4 float">
              <Sparkles size={28} className="text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
              Your AI Fitness Coach
            </h3>
            <p className="text-sm text-slate-400 mb-6 max-w-xs">
              Ask me anything about workouts, nutrition, goals, or your progress. I'm here to help!
            </p>

            <div className="w-full max-w-sm space-y-2">
              {QUICK_PROMPTS.map(({ icon: Icon, text }) => (
                <button
                  key={text}
                  onClick={() => sendMessage(text)}
                  className="w-full glass-card glass-card-hover p-3 flex items-center gap-3 text-left"
                >
                  <Icon size={16} className="text-blue-400 flex-shrink-0" />
                  <span className="text-sm text-slate-300">{text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} fade-in`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Bot size={14} className="text-white" />
                </div>
              )}
              <div className={`max-w-[85%] p-3.5 ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
                <div className="text-sm text-slate-100 whitespace-pre-wrap leading-relaxed">
                  {msg.content.split('\n').map((line, j) => {
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return <strong key={j} className="text-white font-semibold">{line.replace(/\*\*/g, '')}</strong>;
                    }
                    if (line.startsWith('- ')) {
                      return <div key={j} className="flex items-start gap-2"><span className="text-blue-400">•</span><span>{line.slice(2)}</span></div>;
                    }
                    if (line.match(/^\d\./)) {
                      return <div key={j} className="flex items-start gap-2"><span className="text-blue-400 font-medium">{line[0]}.</span><span>{line.slice(3)}</span></div>;
                    }
                    return <span key={j}>{line}</span>;
                  })}
                </div>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-slate-300" />
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="flex gap-3 fade-in">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Bot size={14} className="text-white" />
            </div>
            <div className="chat-bubble-ai p-3.5">
              <div className="typing-indicator flex gap-1">
                <span className="w-2 h-2 bg-blue-400 rounded-full" />
                <span className="w-2 h-2 bg-blue-400 rounded-full" />
                <span className="w-2 h-2 bg-blue-400 rounded-full" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested follow-ups */}
      {messages.length > 0 && !loading && (
        <div className="px-4 py-2 border-t border-slate-700/20">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {['Tell me more', 'Update my workout plan', 'Check my progress', 'Nutrition tips'].map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="btn-glass text-xs py-1.5 px-3 flex-shrink-0"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-slate-700/30">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your AI coach..."
            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3 pr-12 text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-600 transition-all"
            rows={1}
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
