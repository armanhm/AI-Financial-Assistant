import React from 'react';
import { FinancialState } from '../types';
import { Icons } from './Icons';

interface RiskAnalysisProps {
  state: FinancialState;
}

const RiskAnalysis: React.FC<RiskAnalysisProps> = ({ state }) => {
  // 1. Calculate Monthly Burn
  const monthlyExpenses = state.transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const debtPayments = state.loans.reduce((acc, l) => acc + l.monthlyPayment, 0);
  const totalBurn = monthlyExpenses + debtPayments;

  // 2. Emergency Fund Ratio (Months of coverage)
  const emergencyRatio = totalBurn > 0 ? state.cashBalance / totalBurn : 0;
  
  // 3. Debt to Income Ratio
  const dtiRatio = state.monthlyIncome > 0 ? (debtPayments / state.monthlyIncome) * 100 : 0;

  // Helpers for UI state
  const getEmergencyStatus = (ratio: number) => {
    if (ratio >= 6) return { color: 'text-emerald-600', bg: 'bg-emerald-500', label: 'Excellent', width: '100%' };
    if (ratio >= 3) return { color: 'text-emerald-600', bg: 'bg-emerald-500', label: 'Good', width: '75%' };
    if (ratio >= 1) return { color: 'text-amber-600', bg: 'bg-amber-500', label: 'At Risk', width: '30%' };
    return { color: 'text-rose-600', bg: 'bg-rose-500', label: 'Critical', width: '10%' };
  };

  const getDtiStatus = (ratio: number) => {
    if (ratio === 0) return { color: 'text-emerald-600', bg: 'bg-emerald-500', label: 'Debt Free', width: '0%' };
    if (ratio <= 20) return { color: 'text-emerald-600', bg: 'bg-emerald-500', label: 'Healthy', width: '20%' };
    if (ratio <= 36) return { color: 'text-amber-600', bg: 'bg-amber-500', label: 'Manageable', width: '50%' };
    return { color: 'text-rose-600', bg: 'bg-rose-500', label: 'High Burden', width: '90%' };
  };

  const emergencyStatus = getEmergencyStatus(emergencyRatio);
  const dtiStatus = getDtiStatus(dtiRatio);

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full">
      <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
        <Icons.ShieldAlert className="w-5 h-5 text-indigo-500" /> Risk Radar
      </h3>
      
      <div className="space-y-6">
        
        {/* Emergency Fund Indicator */}
        <div>
          <div className="flex justify-between items-end mb-1">
            <span className="text-sm font-medium text-slate-600">Emergency Fund</span>
            <span className={`text-xs font-bold uppercase ${emergencyStatus.color}`}>{emergencyStatus.label}</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
                className={`h-full rounded-full transition-all duration-500 ${emergencyStatus.bg}`} 
                style={{ width: emergencyStatus.width }} 
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            You have <strong>{emergencyRatio.toFixed(1)} months</strong> of expenses saved. Target is 3-6 months.
          </p>
        </div>

        {/* Debt-to-Income Indicator */}
        <div>
          <div className="flex justify-between items-end mb-1">
            <span className="text-sm font-medium text-slate-600">Debt-to-Income (DTI)</span>
            <span className={`text-xs font-bold uppercase ${dtiStatus.color}`}>{dtiStatus.label}</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative">
            {/* Markers for 36% and 50% */}
            <div className="absolute left-[36%] top-0 bottom-0 w-0.5 bg-white z-10 opacity-50"></div>
            <div 
                className={`h-full rounded-full transition-all duration-500 ${dtiStatus.bg}`} 
                style={{ width: dtiStatus.width }} 
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            <strong>{dtiRatio.toFixed(1)}%</strong> of your income goes to debt. Lenders prefer under 36%.
          </p>
        </div>

        {/* High Interest Alert */}
        {state.creditCards.some(c => c.interestRate > 20) || state.loans.some(l => l.interestRate > 10) ? (
          <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 flex gap-3 items-start">
            <Icons.Warning className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-rose-700">High Interest Detected</h4>
              <p className="text-xs text-rose-600 leading-tight mt-1">
                You have debt with high rates. Prioritize paying off items over 10% APR immediately.
              </p>
            </div>
          </div>
        ) : (
             <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex gap-3 items-center">
                <Icons.CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <span className="text-xs font-medium text-emerald-700">Interest rates are within healthy limits.</span>
            </div>
        )}

      </div>
    </div>
  );
};

export default RiskAnalysis;