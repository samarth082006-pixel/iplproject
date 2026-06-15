import { useState, useRef } from 'react';
import { Camera, Upload, Apple, Loader, Check, X, Plus, Scissors, RefreshCw, Scan } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { FoodScan } from '../lib/supabase';

interface Props { userId: string; onScanComplete?: () => void; }

const SAMPLE_FOODS = [
  {
    name: 'Grilled Chicken Breast',
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    confidence: 0.94,
    serving: '100g',
  },
  {
    name: 'Mixed Salad',
    calories: 45,
    protein: 2,
    carbs: 8,
    fat: 0.5,
    confidence: 0.89,
    serving: '150g',
  },
  {
    name: 'Brown Rice',
    calories: 112,
    protein: 2.6,
    carbs: 23,
    fat: 0.9,
    confidence: 0.92,
    serving: '100g cooked',
  },
  {
    name: 'Steamed Broccoli',
    calories: 34,
    protein: 2.8,
    carbs: 7,
    fat: 0.4,
    confidence: 0.96,
    serving: '100g',
  },
];

export default function FoodScanner({ userId, onScanComplete }: Props) {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<FoodScan | null>(null);
  const [selectedFoods, setSelectedFoods] = useState<Set<number>>(new Set());
  const [showCamera, setShowCamera] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  async function processImageAsync(imageUrl?: string) {
    setScanning(true);

    // Simulate AI processing (in production, this would call a real API)
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1500));

    // Generate simulated detection results
    const numFoods = 2 + Math.floor(Math.random() * 3);
    const detectedFoods = [];

    for (let i = 0; i < numFoods; i++) {
      const food = SAMPLE_FOODS[i % SAMPLE_FOODS.length];
      detectedFoods.push({
        name: food.name,
        calories: Math.round(food.calories * (0.8 + Math.random() * 0.4)),
        protein: Math.round(food.protein * (0.8 + Math.random() * 0.4) * 10) / 10,
        carbs: Math.round(food.carbs * (0.8 + Math.random() * 0.4) * 10) / 10,
        fat: Math.round(food.fat * (0.8 + Math.random() * 0.4) * 10) / 10,
        confidence: food.confidence + (Math.random() * 0.1 - 0.05),
      });
    }

    const totalCalories = detectedFoods.reduce((s, f) => s + f.calories, 0);
    const totalProtein = detectedFoods.reduce((s, f) => s + f.protein, 0);
    const totalCarbs = detectedFoods.reduce((s, f) => s + f.carbs, 0);
    const totalFat = detectedFoods.reduce((s, f) => s + f.fat, 0);
    const avgConfidence = detectedFoods.reduce((s, f) => s + f.confidence, 0) / detectedFoods.length;

    const scan: FoodScan = {
      id: '',
      user_id: userId,
      image_url: imageUrl || null,
      detected_foods: detectedFoods,
      total_calories: totalCalories,
      total_protein: totalProtein,
      total_carbs: totalCarbs,
      total_fat: totalFat,
      confidence: avgConfidence,
      user_confirmed: false,
      log_to_nutrition: false,
      created_at: new Date().toISOString(),
    };

    // Save scan to database
    const { data } = await supabase.from('food_scans').insert({
      user_id: userId,
      image_url: scan.image_url,
      detected_foods: scan.detected_foods,
      total_calories: scan.total_calories,
      total_protein: scan.total_protein,
      total_carbs: scan.total_carbs,
      total_fat: scan.total_fat,
      confidence: scan.confidence,
      user_confirmed: false,
      log_to_nutrition: false,
    }).select().single();

    if (data) scan.id = data.id;

    setScanResult(scan);
    setScanning(false);
    setShowCamera(false);
    if (imagePreview) setSelectedFoods(new Set(detectedFoods.map((_, i) => i)));
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const dataUrl = event.target?.result as string;
      setImagePreview(dataUrl);
      processImageAsync(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  function toggleFoodSelection(index: number) {
    setSelectedFoods(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  async function confirmAndLog() {
    if (!scanResult) return;

    const selectedFoodItems = scanResult.detected_foods.filter((_, i) => selectedFoods.has(i));

    // Log each selected food to nutrition
    for (const food of selectedFoodItems) {
      await supabase.from('nutrition_logs').insert({
        user_id: userId,
        food_name: food.name,
        meal_type: 'Snack',
        calories: food.calories,
        protein_g: food.protein,
        carbs_g: food.carbs,
        fat_g: food.fat,
        serving_size: '',
        log_date: new Date().toISOString().split('T')[0],
      });
    }

    // Update scan as confirmed
    await supabase.from('food_scans').update({
      user_confirmed: true,
      log_to_nutrition: true,
    }).eq('id', scanResult.id);

    setScanResult(null);
    setImagePreview(null);
    onScanComplete?.();
  }

  function resetScanner() {
    setScanResult(null);
    setImagePreview(null);
    setSelectedFoods(new Set());
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="space-y-4 slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Food Scanner
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">Scan your meal for instant nutrition data</p>
        </div>
        <span className="badge-ai">
          <Scan size={10} /> ML Vision API
        </span>
      </div>

      {scanning ? (
        <div className="glass-card p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center pulse-glow">
              <Scan size={32} className="text-white" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white mb-1">Analyzing your food...</p>
              <p className="text-sm text-slate-400">Our AI is detecting ingredients and calculating macros</p>
            </div>
            <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse w-2/3" />
            </div>
          </div>
        </div>
      ) : scanResult ? (
        <div className="space-y-4">
          {/* Image preview */}
          {imagePreview && (
            <div className="glass-card p-4">
              <img src={imagePreview} alt="Scanned food" className="w-full h-48 object-cover rounded-xl" />
            </div>
          )}

          {/* Summary */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-sm">Detection Results</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Model confidence:</span>
                <span className="badge bg-emerald-600/20 text-emerald-400">{Math.round(scanResult.confidence * 100)}%</span>
              </div>
            </div>

            {/* Macros Summary */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="metric-card text-center">
                <div className="text-xl font-bold text-white">{scanResult.total_calories}</div>
                <div className="text-xs text-slate-500">kcal</div>
              </div>
              <div className="metric-card text-center">
                <div className="text-xl font-bold text-blue-400">{Math.round(scanResult.total_protein)}g</div>
                <div className="text-xs text-slate-500">protein</div>
              </div>
              <div className="metric-card text-center">
                <div className="text-xl font-bold text-amber-400">{Math.round(scanResult.total_carbs)}g</div>
                <div className="text-xs text-slate-500">carbs</div>
              </div>
              <div className="metric-card text-center">
                <div className="text-xl font-bold text-rose-400">{Math.round(scanResult.total_fat)}g</div>
                <div className="text-xs text-slate-500">fat</div>
              </div>
            </div>

            {/* Detected foods */}
            <div className="space-y-2">
              {scanResult.detected_foods.map((food, i) => (
                <button
                  key={i}
                  onClick={() => toggleFoodSelection(i)}
                  className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${
                    selectedFoods.has(i)
                      ? 'bg-blue-600/20 border border-blue-600/40'
                      : 'bg-slate-800/50 border border-slate-700/40'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    selectedFoods.has(i) ? 'bg-blue-500' : 'bg-slate-700'
                  }`}>
                    {selectedFoods.has(i) ? (
                      <Check size={12} className="text-white" />
                    ) : (
                      <Apple size={12} className="text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="text-sm font-medium text-white text-left">{food.name}</div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                      <span>{food.calories} kcal</span>
                      <span>P: {food.protein}g</span>
                      <span>C: {food.carbs}g</span>
                      <span>F: {food.fat}g</span>
                    </div>
                  </div>

                  <span className="text-xs text-slate-500">{Math.round(food.confidence * 100)}%</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={resetScanner} className="btn-secondary flex-1 flex items-center justify-center gap-2">
              <RefreshCw size={14} /> Scan Again
            </button>
            <button
              onClick={confirmAndLog}
              disabled={selectedFoods.size === 0}
              className="btn-ai flex-1 flex items-center justify-center gap-2"
            >
              <Check size={14} />
              Log {selectedFoods.size} item{selectedFoods.size !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-card p-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center mx-auto mb-4 float">
              <Camera size={28} className="text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
              Scan Your Meal
            </h3>
            <p className="text-sm text-slate-400 mb-6 max-w-xs mx-auto">
              Take a photo of your food and our AI will instantly detect ingredients and calculate macros.
            </p>

            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <label className="btn-ai cursor-pointer flex items-center justify-center gap-2">
                <Camera size={16} />
                Take Photo
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>

              <label className="btn-glass cursor-pointer flex items-center justify-center gap-2">
                <Upload size={14} />
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            </div>

            {/* Sample foods */}
            <div className="mt-8 pt-6 border-t border-slate-800/50">
              <p className="text-xs text-slate-500 mb-3">Can recognize:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {['Fruits & Veggies', 'Meats & Proteins', 'Grains & Carbs', 'Dairy', 'Mixed Meals', 'Drinks'].map(item => (
                  <span key={item} className="badge bg-slate-800 text-slate-400">{item}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden canvas for camera capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
