import React, { useState, useEffect } from 'react';
import { analyzeFinancialScenario } from '../services/geminiService';
import { FinancialState, AIAnalysisResult } from '../types';
import { Icons } from './Icons';

interface AIAssistantProps {
  current: FinancialState;
  simulated: FinancialState | null;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ current, simulated }) => {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastAnalyzedTime, setLastAnalyzedTime] = useState<number>(0);

  const handleAnalyze = async () => {
    setLoading(true);
    const result = await analyzeFinancialScenario(current, simulated);
    setAnalysis(result);
    setLoading(false);
    setLastAnalyzedTime(Date.now());
  };

  // Auto-analyze when simulation starts or changes significantly (debounced in real app, here manual trigger preferred to save tokens)
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <Icons.AI className="w-5 h-5 text-white" />
          </div>
          <div>
             <h3 className="font-bold text-slate-800">Gemini Financial Advisor</h3>
             <p className="text-xs text-slate-500">Powered by Google Gemini 2.5 Flash</p>
          </div>
        </div>
        <button 
          onClick={handleAnalyze}
          disabled={loading}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            loading 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'
          }`}
        >
          {loading ? 'Analyzing...' : 'Analyze Now'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {analysis ? (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Health Score */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
               <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" r="28" stroke="#e2e8f0" strokeWidth="6" fill="transparent" />
                    <circle 
                      cx="32" cy="32" r="28" 
                      stroke={analysis.score > 70 ? '#10b981' : analysis.score > 40 ? '#f59e0b' : '#f43f5e'} 
                      strokeWidth="6" 
                      fill="transparent" 
                      strokeDasharray={175.9}
                      strokeDashoffset={175.9 - (175.9 * analysis.score) / 100}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <span className="absolute text-lg font-bold text-slate-700">{analysis.score}</span>
               </div>
               <div>
                 <h4 className="font-semibold text-slate-700">Financial Health Score</h4>
                 <p className="text-sm text-slate-500">{simulated ? "Based on Simulation" : "Current Status"}</p>
               </div>
            </div>

            {/* Summary */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-2">Analysis</h4>
              <p className="text-slate-600 text-sm leading-relaxed bg-blue-50/50 p-3 rounded-lg border border-blue-50">
                {analysis.summary}
              </p>
            </div>

            {/* Recommendations */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-2">Recommendations</h4>
              <ul className="space-y-3">
                {analysis.recommendations.map((rec, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <div className="mt-1 min-w-[20px] h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs font-bold">
                      {i + 1}
                    </div>
                    <span className="text-sm text-slate-600">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-8">
            <Icons.AI className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm">Click "Analyze Now" to get AI-powered insights on your current finances or active simulation.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;