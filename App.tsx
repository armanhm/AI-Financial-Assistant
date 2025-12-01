
import React, { useState } from 'react';
import { FinancialState, Transaction, Investment, InvestmentSuggestion } from './types';
import { Icons } from './components/Icons';
import SimulationControl from './components/SimulationControl';
import { NetWorthChart, ExpenseBreakdown, generateProjectionData } from './components/FinancialCharts';
import AIAssistant from './components/AIAssistant';
import RiskAnalysis from './components/RiskAnalysis';
import CreditCoach from './components/CreditCoach';
import InvestmentSuggestions from './components/InvestmentSuggestions';

// Initial Mock Data
const INITIAL_STATE: FinancialState = {
  cashBalance: 15400,
  monthlyIncome: 6200,
  transactions: [
    { id: '1', date: '2023-10-01', description: 'Tech Corp Salary', amount: 3100, category: 'Income', type: 'income' },
    { id: '2', date: '2023-10-02', description: 'Whole Foods Market', amount: 145.20, category: 'Groceries', type: 'expense' },
    { id: '3', date: '2023-10-05', description: 'Shell Station', amount: 45.00, category: 'Transport', type: 'expense' },
    { id: '4', date: '2023-10-08', description: 'Netflix Subscription', amount: 15.99, category: 'Entertainment', type: 'expense' },
    { id: '5', date: '2023-10-10', description: 'City Utilities', amount: 120.50, category: 'Utilities', type: 'expense' },
    { id: '6', date: '2023-10-15', description: 'Tech Corp Salary', amount: 3100, category: 'Income', type: 'income' },
    { id: '7', date: '2023-10-16', description: 'Favorite Bistro', amount: 85.00, category: 'Dining', type: 'expense' },
    { id: '8', date: '2023-10-20', description: 'Amazon Purchase', amount: 65.99, category: 'Shopping', type: 'expense' },
  ],
  creditCards: [
    { id: 'c1', name: 'Sapphire Preferred', cashbackRate: 1.5, annualFee: 95, interestRate: 18.24 }
  ],
  loans: [
    { id: 'l1', name: 'Student Loan', principal: 25000, remainingBalance: 18400, interestRate: 4.5, monthlyPayment: 260, termMonths: 120 }
  ],
  investments: [
    { id: 'i1', name: '401(k)', balance: 12500, annualReturnRate: 6.5, monthlyContribution: 200 }
  ]
};

type View = 'dashboard' | 'investments';

const App: React.FC = () => {
  const [currentState, setCurrentState] = useState<FinancialState>(INITIAL_STATE);
  const [simState, setSimState] = useState<FinancialState | null>(null);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  
  // New Transaction Form State
  const [newTransDesc, setNewTransDesc] = useState('');
  const [newTransAmount, setNewTransAmount] = useState('');
  const [newTransCategory, setNewTransCategory] = useState('General');
  const [newTransType, setNewTransType] = useState<'income'|'expense'>('expense');

  // Simulation Toggle Logic
  const isSimulating = !!simState;
  const toggleSimulation = () => {
    if (isSimulating) {
      setSimState(null);
    } else {
      setSimState(JSON.parse(JSON.stringify(currentState)));
    }
  };

  const activeState = simState || currentState;

  // Add Transaction Handler
  const handleAddTransaction = () => {
    if (!newTransDesc || !newTransAmount) return;
    
    const amount = parseFloat(newTransAmount);
    const newTx: Transaction = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        description: newTransDesc,
        amount: amount,
        category: newTransCategory,
        type: newTransType
    };

    const updatedState = {
        ...currentState,
        transactions: [newTx, ...currentState.transactions],
        cashBalance: newTransType === 'income' 
            ? currentState.cashBalance + amount 
            : currentState.cashBalance - amount
    };

    setCurrentState(updatedState);
    setShowAddTransaction(false);
    setNewTransDesc('');
    setNewTransAmount('');
  };

  const handleAddInvestmentFromSuggestion = (suggestion: InvestmentSuggestion) => {
    // Parse estimated return string "8-10%" -> 9.0
    const nums = suggestion.estimatedReturn.match(/(\d+\.?\d*)/g);
    let returnRate = 7.0;
    if (nums) {
       returnRate = nums.length === 2 ? (parseFloat(nums[0]) + parseFloat(nums[1])) / 2 : parseFloat(nums[0]);
    }

    const newInv: Investment = {
      id: `inv-${Date.now()}`,
      name: `${suggestion.symbol} (${suggestion.name})`,
      balance: 0,
      monthlyContribution: 200, // Default start assumption
      annualReturnRate: returnRate
    };

    if (isSimulating) {
      setSimState({
        ...simState!,
        investments: [...simState!.investments, newInv]
      });
      setActiveView('dashboard');
    } else {
      // If not simulating, enable simulation mode with this new asset to show impact safely first
      const newState = JSON.parse(JSON.stringify(currentState));
      newState.investments.push(newInv);
      setSimState(newState);
      setActiveView('dashboard');
    }
  };

  // Derived Metrics
  const totalExpenses = activeState.transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);
    
  const totalDebt = activeState.loans.reduce((acc, l) => acc + l.remainingBalance, 0);
  const totalMonthlyDebtPayments = activeState.loans.reduce((acc, l) => acc + l.monthlyPayment, 0);
  const totalInvestments = activeState.investments.reduce((acc, i) => acc + i.balance, 0);
  const monthlyInvContribution = activeState.investments.reduce((acc, i) => acc + i.monthlyContribution, 0);
  
  const estimatedSavings = activeState.monthlyIncome - totalExpenses - totalMonthlyDebtPayments - monthlyInvContribution;

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800 font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-850 text-slate-300 flex flex-col fixed h-full z-20 shadow-xl border-r border-slate-800">
        <div className="p-6 flex items-center gap-3 text-white">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Icons.TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">FinSim AI</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button 
            onClick={() => setActiveView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer border transition-all ${activeView === 'dashboard' ? 'bg-slate-800 text-white border-slate-700/50 shadow-sm' : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Icons.Dashboard className={`w-5 h-5 ${activeView === 'dashboard' ? 'text-indigo-400' : ''}`} />
            <span className="font-medium">Dashboard</span>
          </button>
          
          <button 
            onClick={() => setActiveView('investments')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer border transition-all ${activeView === 'investments' ? 'bg-slate-800 text-white border-slate-700/50 shadow-sm' : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Icons.Target className={`w-5 h-5 ${activeView === 'investments' ? 'text-indigo-400' : ''}`} />
            <span className="font-medium">Investment Center</span>
          </button>

          <div className="hover:bg-slate-800 hover:text-white transition flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer text-slate-400">
            <Icons.ShieldAlert className="w-5 h-5" />
            <span>Risk Center</span>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 text-sm text-slate-400 mb-2">
            <div className="relative">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <div className="absolute top-0 left-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-75"></div>
            </div>
            <span>API Connected</span>
          </div>
          <p className="text-xs text-slate-600">v1.4.1-layout</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 p-8 max-w-[1600px]">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {activeView === 'dashboard' ? 'Financial Overview' : 'Investment Planning'}
            </h1>
            <p className="text-slate-500">
              {activeView === 'dashboard' ? 'Manage assets, debts, and simulate future wealth.' : 'AI-powered recommendations for your portfolio.'}
            </p>
          </div>
          <div className="flex gap-4">
            <button 
                onClick={() => setShowAddTransaction(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition shadow-sm hover:shadow-indigo-200"
            >
                <Icons.Plus className="w-4 h-4" /> Add Transaction
            </button>
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 flex flex-col items-end min-w-[140px]">
               <span className="text-xs text-slate-400 uppercase font-bold tracking-wide">Total Net Worth</span>
               <span className={`text-lg font-bold ${isSimulating ? 'text-indigo-600' : 'text-emerald-600'}`}>
                 ${(activeState.cashBalance + totalInvestments - totalDebt).toLocaleString(undefined, { maximumFractionDigits: 0 })}
               </span>
            </div>
          </div>
        </header>

        {/* Modal for Adding Transaction */}
        {showAddTransaction && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-fadeIn">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-800">Add Transaction</h3>
                        <button onClick={() => setShowAddTransaction(false)} className="text-slate-400 hover:text-slate-600">
                            <Icons.Close className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="space-y-4">
                        <div className="flex gap-2">
                             <button 
                                onClick={() => setNewTransType('expense')}
                                className={`flex-1 py-2 rounded-md font-medium text-sm border transition-colors ${newTransType === 'expense' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                             >Expense</button>
                             <button 
                                onClick={() => setNewTransType('income')}
                                className={`flex-1 py-2 rounded-md font-medium text-sm border transition-colors ${newTransType === 'income' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                             >Income</button>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                            <input 
                                autoFocus
                                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" 
                                placeholder="e.g. Grocery Store"
                                value={newTransDesc}
                                onChange={e => setNewTransDesc(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Amount ($)</label>
                                <input 
                                    type="number"
                                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" 
                                    placeholder="0.00"
                                    value={newTransAmount}
                                    onChange={e => setNewTransAmount(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
                                <select 
                                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                    value={newTransCategory}
                                    onChange={e => setNewTransCategory(e.target.value)}
                                >
                                    <option>General</option>
                                    <option>Dining</option>
                                    <option>Groceries</option>
                                    <option>Transport</option>
                                    <option>Utilities</option>
                                    <option>Entertainment</option>
                                    <option>Income</option>
                                </select>
                            </div>
                        </div>
                        <button 
                            onClick={handleAddTransaction}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg mt-2 shadow-md transition"
                        >
                            Save Transaction
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW: DASHBOARD */}
        {/* ========================================================================= */}
        {activeView === 'dashboard' && (
        <div className="grid grid-cols-12 gap-6 animate-fadeIn">
          
          {/* Top Metrics Cards - Full Row */}
          <div className="col-span-12 grid grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-blue-50 rounded-lg"><Icons.Wallet className="w-5 h-5 text-blue-600"/></div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${estimatedSavings > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {estimatedSavings > 0 ? '+SAVING' : '-BURNING'}
                </span>
              </div>
              <p className="text-slate-500 text-sm">Monthly Net Flow</p>
              <h3 className="text-2xl font-bold text-slate-800">${estimatedSavings.toLocaleString()}</h3>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
               <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-emerald-50 rounded-lg"><Icons.PiggyBank className="w-5 h-5 text-emerald-600"/></div>
              </div>
              <p className="text-slate-500 text-sm">Investments</p>
              <h3 className="text-2xl font-bold text-slate-800">${totalInvestments.toLocaleString()}</h3>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
               <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-rose-50 rounded-lg"><Icons.TrendingDown className="w-5 h-5 text-rose-600"/></div>
              </div>
              <p className="text-slate-500 text-sm">Total Debt</p>
              <h3 className="text-2xl font-bold text-slate-800">${totalDebt.toLocaleString(undefined, {maximumFractionDigits:0})}</h3>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center cursor-pointer hover:bg-slate-50 transition border-dashed border-2 group">
              <div className="p-2 bg-slate-100 rounded-full mb-2 group-hover:bg-indigo-100 transition-colors">
                <Icons.Plus className="w-6 h-6 text-slate-400 group-hover:text-indigo-500" />
              </div>
              <span className="text-sm font-medium text-slate-500 group-hover:text-indigo-600">Connect Bank</span>
            </div>
          </div>

          {/* Left Column (Main) */}
          <div className="col-span-8 space-y-6">
              
              {/* Row: Risk & Coach Widgets */}
              <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-1 h-full">
                      <RiskAnalysis state={activeState} />
                  </div>
                  <div className="col-span-1 h-full">
                      <CreditCoach state={activeState} />
                  </div>
              </div>

              {/* Row: Charts */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                      <h3 className="font-bold text-lg text-slate-800">Wealth Projection (12 Months)</h3>
                      <p className="text-xs text-slate-500">Includes Cash, Investments, and Debt Amortization</p>
                  </div>
                  <div className="flex gap-3 text-sm">
                     <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded border border-emerald-100">
                       <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div> 
                       <span className="text-emerald-900 font-medium">Current</span>
                     </span>
                     {isSimulating && (
                      <span className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 rounded border border-indigo-100">
                        <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></div> 
                        <span className="text-indigo-900 font-medium">Simulated</span>
                      </span>
                     )}
                  </div>
                </div>
                <NetWorthChart current={currentState} simulated={simState} />
              </div>

              {/* Simulation Controls */}
              <div className={`transition-all duration-300 ${isSimulating ? 'ring-4 ring-indigo-500/20 rounded-xl' : ''}`}>
                 <SimulationControl 
                   baseState={currentState}
                   simState={simState || currentState} 
                   setSimState={setSimState}
                   isActive={isSimulating}
                   onToggle={toggleSimulation}
                 />
              </div>

              {/* Transactions List */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                 <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                   <h3 className="font-bold text-lg text-slate-800">Recent Transactions</h3>
                   <button className="text-sm text-indigo-600 font-medium hover:underline hover:text-indigo-700">View All</button>
                 </div>
                 <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm text-slate-600">
                     <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                       <tr>
                         <th className="px-6 py-3">Date</th>
                         <th className="px-6 py-3">Description</th>
                         <th className="px-6 py-3">Category</th>
                         <th className="px-6 py-3 text-right">Amount</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                       {activeState.transactions.slice(0, 8).map((t) => (
                         <tr key={t.id} className="hover:bg-slate-50 transition">
                           <td className="px-6 py-3 whitespace-nowrap text-slate-400 font-mono text-xs">{t.date}</td>
                           <td className="px-6 py-3 font-medium text-slate-800">{t.description}</td>
                           <td className="px-6 py-3"><span className="px-2 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600 border border-slate-200">{t.category}</span></td>
                           <td className={`px-6 py-3 text-right font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                             {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
              </div>

          </div>

          {/* Right Column (Sidebar) */}
          <div className="col-span-4 space-y-6">
             
              {/* AI Advisor */}
              <div className="h-[520px]">
                 <AIAssistant current={currentState} simulated={simState} />
              </div>

              {/* Spending Chart */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                 <h3 className="font-bold text-lg text-slate-800 mb-4">Spending by Category</h3>
                 <ExpenseBreakdown transactions={activeState.transactions} />
              </div>

              {/* Sim State Differences Details */}
              {isSimulating && (
                <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-xl border border-indigo-100 shadow-sm animate-fadeIn">
                  <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
                      <Icons.Chart className="w-4 h-4 text-indigo-500" /> Simulation Impact (1 Year)
                  </h3>
                  <div className="space-y-4">
                     <div className="flex justify-between text-sm items-center">
                        <span className="text-slate-600">Projected Net Worth</span>
                        <span className="font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded text-base">
                          ${(generateProjectionData(simState!, 12).pop()?.actualNetWorth || 0).toLocaleString(undefined, {maximumFractionDigits:0})}
                        </span>
                     </div>
                     <div className="flex justify-between text-sm items-center">
                        <span className="text-slate-600">Investments Contribution</span>
                        <span className="font-semibold text-emerald-600">+${(simState!.investments.reduce((a,i) => a+i.monthlyContribution * 12, 0)).toLocaleString()}</span>
                     </div>
                     
                     <div className="flex justify-between text-sm items-center">
                        <span className="text-slate-600">New Loan Debt</span>
                        <span className="font-semibold text-rose-600">+${(simState!.loans.reduce((a,l) => a+l.principal, 0) - currentState.loans.reduce((a,l) => a+l.principal, 0)).toLocaleString()}</span>
                     </div>

                     <div className="pt-3 border-t border-indigo-100 mt-2">
                        <button 
                          onClick={() => {
                            setCurrentState(simState!);
                            setSimState(null);
                          }}
                          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold text-sm shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all"
                        >
                          Apply Changes to Profile
                        </button>
                     </div>
                  </div>
                </div>
              )}

          </div>

        </div>
        )}
        
        {/* ========================================================================= */}
        {/* VIEW: INVESTMENTS */}
        {/* ========================================================================= */}
        {activeView === 'investments' && (
          <InvestmentSuggestions 
             onAddAsset={handleAddInvestmentFromSuggestion} 
             currentInvestments={activeState.investments}
          />
        )}

      </main>
    </div>
  );
};

export default App;
