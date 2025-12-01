
import React, { useState } from 'react';
import { FinancialState } from '../types';
import { Icons } from './Icons';
import { GoogleGenAI } from "@google/genai";

interface CreditCoachProps {
  state: FinancialState;
}

const CreditCoach: React.FC<CreditCoachProps> = ({ state }) => {
  const [tip, setTip] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 1. Mock Credit Score Calculation
  // Base 750
  // -10 points for every 10% DTI over 30%
  // -5 points for every loan
  // -2 points for high utilization (mocked)
  const calculateMockScore = () => {
    let score = 750;
    
    // DTI Impact
    const debtPayments = state.loans.reduce((acc, l) => acc + l.monthlyPayment, 0);
    const dti = state.monthlyIncome > 0 ? (debtPayments / state.monthlyIncome) * 100 : 0;
    if (dti > 30) {
        score -= (dti - 30);
    }

    // Number of Accounts Impact
    score -= (state.loans.length * 5);
    score -= (state.creditCards.length * 2);

    return Math.round(Math.max(300, Math.min(850, score)));
  };

  const score = calculateMockScore();
  
  // Score Color
  const getScoreColor = (s: number) => {
    if (s >= 800) return 'text-emerald-600';
    if (s >= 740) return 'text-indigo-600';
    if (s >= 670) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getAIAdvice = async () => {
    if (!process.env.API_KEY) {
        setTip("API Key missing. Cannot generate advice.");
        return;
    }
    setLoading(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `The user has a credit score of approx ${score}. 
            Debts: ${state.loans.length} loans, ${state.creditCards.length} credit cards. 
            Monthly Debt Payment: $${state.loans.reduce((acc, l) => acc + l.monthlyPayment, 0)}.
            Give one specific, advanced, 1-sentence tip to improve this score within 6 months.`,
        });
        setTip(response.text);
    } catch (e) {
        setTip("Focus on paying down your highest interest revolving debt first.");
    }
    setLoading(false);
  };

  // SVG Configuration
  // Size: 128px (w-32)
  // Center: 64, 64
  // Radius: 56 (leaving space for stroke)
  // Circumference: 2 * pi * 56 ≈ 351.86
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * ((score - 300) / 550));

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
      <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
        <Icons.GraduationCap className="w-5 h-5 text-indigo-500" /> Credit Coach
      </h3>

      <div className="flex items-center justify-between mb-6">
        <div className="relative w-32 h-32 flex-shrink-0">
            {/* Simple Gauge Visualization */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                <circle cx="64" cy="64" r={radius} stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
                <circle 
                    cx="64" cy="64" r={radius} 
                    stroke="currentColor" 
                    strokeWidth="10" 
                    fill="transparent" 
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className={`transition-all duration-1000 ${getScoreColor(score)}`}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}</span>
                <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wide mt-1">Est. Score</span>
            </div>
        </div>
        <div className="flex-1 pl-6">
             <div className="space-y-3">
                 <div className="flex justify-between text-xs text-slate-500 border-b border-slate-100 pb-2">
                    <span>Credit Age</span>
                    <span className="font-medium text-slate-700">~4.2 Years</span>
                 </div>
                 <div className="flex justify-between text-xs text-slate-500 border-b border-slate-100 pb-2">
                    <span>Accounts</span>
                    <span className="font-medium text-slate-700">{state.loans.length + state.creditCards.length} Total</span>
                 </div>
                 <div className="flex justify-between text-xs text-slate-500">
                    <span>Inquiries</span>
                    <span className="font-medium text-emerald-600">Very Low</span>
                 </div>
             </div>
        </div>
      </div>

      <div className="mt-auto bg-indigo-50 rounded-lg p-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 opacity-10">
            <Icons.AI className="w-12 h-12 text-indigo-600" />
        </div>
        {tip ? (
             <div className="relative z-10 animate-fadeIn">
                <h4 className="text-xs font-bold text-indigo-800 uppercase mb-1">Coach's Tip</h4>
                <p className="text-xs text-indigo-700 italic leading-relaxed">"{tip}"</p>
             </div>
        ) : (
            <button 
                onClick={getAIAdvice}
                disabled={loading}
                className="relative z-10 w-full flex items-center justify-center gap-2 text-xs font-bold text-indigo-700 hover:text-indigo-800 transition-colors py-1"
            >
                {loading ? (
                    <span className="flex items-center gap-2"><Icons.Reset className="w-3 h-3 animate-spin" /> Thinking...</span>
                ) : (
                    <>
                    <Icons.AI className="w-3 h-3" /> Get Personalized Strategy
                    </>
                )}
            </button>
        )}
      </div>
    </div>
  );
};

export default CreditCoach;
