import React, { useState } from 'react';
import { FinancialState, Loan, CreditCard, Investment } from '../types';
import { Icons } from './Icons';

interface SimulationControlProps {
  baseState: FinancialState;
  simState: FinancialState;
  setSimState: (state: FinancialState) => void;
  isActive: boolean;
  onToggle: () => void;
}

const SimulationControl: React.FC<SimulationControlProps> = ({ 
  baseState, 
  simState, 
  setSimState, 
  isActive, 
  onToggle 
}) => {
  const [newLoanAmount, setNewLoanAmount] = useState<number>(10000);
  const [newLoanRate, setNewLoanRate] = useState<number>(5.5);
  const [newCardCashback, setNewCardCashback] = useState<number>(2.0);
  
  // Investment State
  const [invAmount, setInvAmount] = useState<number>(500);
  const [invReturn, setInvReturn] = useState<number>(8.0);

  const addLoan = () => {
    // Standard Monthly Payment Formula: P * (r(1+r)^n) / ((1+r)^n - 1)
    const r = newLoanRate / 100 / 12;
    const n = 60; // 5 years fixed for simplicity
    const monthlyPayment = (newLoanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

    const loan: Loan = {
      id: `sim-loan-${Date.now()}`,
      name: `Simulated Loan ($${(newLoanAmount/1000).toFixed(1)}k)`,
      principal: newLoanAmount,
      remainingBalance: newLoanAmount,
      interestRate: newLoanRate,
      monthlyPayment: monthlyPayment,
      termMonths: n
    };
    
    // In simulation: Receiving a loan means Cash increases now, but Debt increases
    setSimState({
      ...simState,
      loans: [...simState.loans, loan],
      cashBalance: simState.cashBalance + newLoanAmount 
    });
  };

  const addCreditCard = () => {
    const card: CreditCard = {
      id: `sim-card-${Date.now()}`,
      name: `Simulated Rewards (${newCardCashback}%)`,
      cashbackRate: newCardCashback,
      annualFee: 0,
      interestRate: 19.99
    };
    setSimState({
      ...simState,
      creditCards: [...simState.creditCards, card]
    });
  };

  const addInvestment = () => {
    const investment: Investment = {
        id: `sim-inv-${Date.now()}`,
        name: `Simulated Portfolio`,
        balance: 0,
        monthlyContribution: invAmount,
        annualReturnRate: invReturn
    };
    
    setSimState({
        ...simState,
        investments: [...simState.investments, investment]
    });
  };

  const resetSimulation = () => {
    setSimState(JSON.parse(JSON.stringify(baseState)));
  };

  if (!isActive) {
    return (
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-xl text-white shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Icons.AI className="w-24 h-24" />
        </div>
        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <Icons.AI className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold">Simulator Inactive</h2>
            </div>
            <p className="mb-6 text-indigo-100 text-sm leading-relaxed max-w-[90%]">
            Test financial decisions safely. See how a new loan, credit card, or investment strategy impacts your net worth over time.
            </p>
            <button 
            onClick={onToggle}
            className="w-full bg-white text-indigo-700 font-bold py-3 px-4 rounded-lg hover:bg-indigo-50 transition-all shadow-md flex items-center justify-center gap-2"
            >
            <Icons.TrendingUp className="w-4 h-4" /> Start New Simulation
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-indigo-500 p-6 rounded-xl shadow-lg relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-pulse"></div>
        
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 text-indigo-700">
             <div className="bg-indigo-100 p-1.5 rounded-md">
                 <Icons.AI className="w-5 h-5" />
             </div>
             <div>
                <h2 className="text-lg font-bold leading-tight">Simulator Active</h2>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-indigo-400">Sandbox Mode</p>
             </div>
          </div>
          <button onClick={onToggle} className="text-xs text-slate-400 hover:text-slate-600 underline decoration-slate-300 underline-offset-2">
            Exit Simulation
          </button>
        </div>

        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          
          {/* Add Loan Scenario */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 hover:border-indigo-200 transition-colors group">
            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icons.TrendingDown className="w-3.5 h-3.5 text-rose-600" /> 
                </div>
                Take a Loan
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Amount</label>
                <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 text-xs">$</span>
                    <input 
                    type="number" 
                    value={newLoanAmount}
                    onChange={(e) => setNewLoanAmount(Number(e.target.value))}
                    className="w-full text-sm border-slate-200 rounded-md py-1.5 pl-6 pr-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Interest</label>
                <div className="relative">
                    <input 
                    type="number" 
                    value={newLoanRate}
                    onChange={(e) => setNewLoanRate(Number(e.target.value))}
                    className="w-full text-sm border-slate-200 rounded-md py-1.5 pl-2 pr-6 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <span className="absolute right-2.5 top-2 text-slate-400 text-xs">%</span>
                </div>
              </div>
            </div>
            <button 
              onClick={addLoan}
              className="w-full bg-white border border-slate-200 text-slate-600 text-xs font-bold py-2 rounded-md hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm"
            >
              Add Loan to Scenario
            </button>
          </div>

          {/* Investment Scenario */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 hover:border-indigo-200 transition-colors group">
            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icons.TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> 
                </div>
                Start Investing
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Monthly</label>
                <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 text-xs">$</span>
                    <input 
                    type="number" 
                    value={invAmount}
                    onChange={(e) => setInvAmount(Number(e.target.value))}
                    className="w-full text-sm border-slate-200 rounded-md py-1.5 pl-6 pr-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Return</label>
                <div className="relative">
                    <input 
                    type="number" 
                    value={invReturn}
                    step="0.5"
                    onChange={(e) => setInvReturn(Number(e.target.value))}
                    className="w-full text-sm border-slate-200 rounded-md py-1.5 pl-2 pr-6 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <span className="absolute right-2.5 top-2 text-slate-400 text-xs">%</span>
                </div>
              </div>
            </div>
            <button 
              onClick={addInvestment}
              className="w-full bg-white border border-slate-200 text-slate-600 text-xs font-bold py-2 rounded-md hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm"
            >
              Add Investment Plan
            </button>
          </div>

          {/* Change Card Scenario */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 hover:border-indigo-200 transition-colors group">
            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icons.CreditCard className="w-3.5 h-3.5 text-amber-600" /> 
                </div>
                Better Credit Card
            </h3>
            <div className="mb-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">New Cashback Rate</label>
              <div className="relative">
                <input 
                    type="number" 
                    step="0.5"
                    value={newCardCashback}
                    onChange={(e) => setNewCardCashback(Number(e.target.value))}
                    className="w-full text-sm border-slate-200 rounded-md py-1.5 pl-2 pr-6 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <span className="absolute right-2.5 top-2 text-slate-400 text-xs">%</span>
              </div>
            </div>
            <button 
              onClick={addCreditCard}
              className="w-full bg-white border border-slate-200 text-slate-600 text-xs font-bold py-2 rounded-md hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-all shadow-sm"
            >
              Apply New Card
            </button>
          </div>

          {/* Controls */}
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button 
              onClick={resetSimulation}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-500 py-2.5 rounded-lg hover:bg-slate-200 hover:text-slate-700 text-xs font-bold transition-colors"
            >
              <Icons.Reset className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

        </div>
    </div>
  );
};

export default SimulationControl;