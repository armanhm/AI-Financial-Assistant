
import React, { useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  ScatterChart, Scatter, ZAxis, Cell, ReferenceLine, Legend
} from 'recharts';
import { Investment, InvestmentSuggestion, FinancialState } from '../types';
import { Icons } from './Icons';

interface InvestmentSimulatorModalProps {
  currentInvestments: Investment[];
  candidate: InvestmentSuggestion;
  onConfirm: () => void;
  onClose: () => void;
}

export const InvestmentSimulatorModal: React.FC<InvestmentSimulatorModalProps> = ({
  currentInvestments,
  candidate,
  onConfirm,
  onClose
}) => {
  // Parse candidate return rate (e.g., "8-10%" -> 9.0)
  const candidateReturn = useMemo(() => {
    const nums = candidate.estimatedReturn.match(/(\d+\.?\d*)/g);
    if (!nums) return 7.0;
    if (nums.length === 2) return (parseFloat(nums[0]) + parseFloat(nums[1])) / 2;
    return parseFloat(nums[0]);
  }, [candidate]);

  // Parse risk to numeric value for chart
  const getRiskValue = (risk: string) => {
    switch(risk.toLowerCase()) {
      case 'low': return 1;
      case 'medium': return 2;
      case 'high': return 3;
      default: return 2;
    }
  };

  // 1. Prepare Growth Projection Data (5 Years)
  const projectionData = useMemo(() => {
    const data = [];
    let currentTotal = currentInvestments.reduce((acc, i) => acc + i.balance, 0);
    // Assume we start the new asset with a mock principal or just contribution projection
    let simulatedTotal = currentTotal;
    
    // Monthly Contribution Assumptions
    const currentMonthlyContrib = currentInvestments.reduce((acc, i) => acc + i.monthlyContribution, 0);
    const newAssetMonthlyContrib = 200; // Assumption for simulation visualization

    for (let month = 0; month <= 60; month++) {
      data.push({
        month: `M${month}`,
        Current: Math.round(currentTotal),
        WithNewAsset: Math.round(simulatedTotal)
      });

      // Compound Current
      // Weighted average return of current portfolio (simplified)
      const currentAvgReturn = currentInvestments.length > 0 
        ? currentInvestments.reduce((acc, i) => acc + i.annualReturnRate, 0) / currentInvestments.length 
        : 5.0; // Default if empty

      currentTotal += currentMonthlyContrib;
      currentTotal += currentTotal * (currentAvgReturn / 100 / 12);

      // Compound Simulated (Current + New Asset separate calculation)
      // We add the new asset contribution to the mix
      simulatedTotal += (currentMonthlyContrib + newAssetMonthlyContrib);
      
      // Calculate blended return is complex, so we treat new asset growth separately and add it
      // Existing part grows at existing rate
      const existingPartGrowth = (simulatedTotal - (month * newAssetMonthlyContrib)) * (currentAvgReturn / 100 / 12);
      // New part grows at new rate
      const newPartGrowth = (month * newAssetMonthlyContrib) * (candidateReturn / 100 / 12);
      
      // Approximate growth update (simplified for UI speed)
      simulatedTotal += (simulatedTotal * ((currentAvgReturn + (candidateReturn - currentAvgReturn) * 0.2) / 100 / 12));
    }
    return data;
  }, [currentInvestments, candidateReturn]);

  // 2. Prepare Risk vs Return Scatter Data
  const riskData = useMemo(() => {
    const existingPoints = currentInvestments.map(inv => ({
      name: inv.name,
      return: inv.annualReturnRate,
      risk: inv.annualReturnRate > 10 ? 3 : inv.annualReturnRate > 6 ? 2 : 1, // Infer risk from return if not stored
      type: 'Existing',
      z: 100 // Size of bubble
    }));

    const newPoint = {
      name: candidate.symbol,
      return: candidateReturn,
      risk: getRiskValue(candidate.riskLevel),
      type: 'New',
      z: 250
    };

    return [...existingPoints, newPoint];
  }, [currentInvestments, candidate, candidateReturn]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
               <Icons.Target className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Simulate Asset Addition</h2>
              <p className="text-sm text-slate-500">Analyze how <span className="font-bold text-indigo-600">{candidate.symbol}</span> impacts your portfolio</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <Icons.Close className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Chart 1: Growth Projection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
               <h3 className="font-bold text-slate-700 flex items-center gap-2">
                 <Icons.TrendingUp className="w-4 h-4 text-emerald-500" /> 5-Year Growth Projection
               </h3>
               <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-emerald-100 font-medium">
                 With +$200/mo contrib.
               </span>
            </div>
            <div className="h-[250px] w-full bg-slate-50 rounded-xl border border-slate-100 p-2">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={projectionData}>
                   <defs>
                     <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2}/>
                       <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                     </linearGradient>
                     <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                       <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                   <XAxis dataKey="month" hide />
                   <YAxis hide domain={['auto', 'auto']} />
                   <RechartsTooltip 
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}}
                      formatter={(val: number) => `$${val.toLocaleString()}`}
                   />
                   <Area type="monotone" dataKey="Current" stackId="1" stroke="#94a3b8" fill="url(#colorBase)" />
                   <Area type="monotone" dataKey="WithNewAsset" stackId="2" stroke="#4f46e5" strokeWidth={3} fill="url(#colorNew)" />
                   <Legend />
                 </AreaChart>
               </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-500 italic">
              *Projection assumes the new asset is added with a $200 monthly contribution and maintains its estimated return rate.
            </p>
          </div>

          {/* Chart 2: Risk Map */}
          <div className="space-y-4">
             <div className="flex items-center justify-between">
               <h3 className="font-bold text-slate-700 flex items-center gap-2">
                 <Icons.ShieldAlert className="w-4 h-4 text-amber-500" /> Risk vs. Return Map
               </h3>
             </div>
             <div className="h-[250px] w-full bg-slate-50 rounded-xl border border-slate-100 p-2 relative">
               {/* Background Quadrants */}
               <div className="absolute inset-4 grid grid-cols-2 grid-rows-2 pointer-events-none opacity-50">
                   <div className="border-r border-b border-slate-200 bg-emerald-50/30"></div> {/* Low Risk High Return (Ideal) */}
                   <div className="border-b border-slate-200 bg-amber-50/30"></div> {/* High Risk High Return */}
                   <div className="border-r border-slate-200 bg-slate-100/30"></div> {/* Low Risk Low Return */}
                   <div className="bg-rose-50/30"></div> {/* High Risk Low Return (Bad) */}
               </div>
               
               <ResponsiveContainer width="100%" height="100%">
                 <ScatterChart margin={{top: 20, right: 20, bottom: 20, left: 0}}>
                   <CartesianGrid strokeDasharray="3 3" />
                   <XAxis 
                      type="number" 
                      dataKey="risk" 
                      name="Risk" 
                      domain={[0, 4]} 
                      ticks={[1, 2, 3]}
                      tickFormatter={(val) => val === 1 ? 'Low' : val === 2 ? 'Med' : 'High'}
                   />
                   <YAxis 
                      type="number" 
                      dataKey="return" 
                      name="Return" 
                      unit="%" 
                      domain={[0, 'auto']}
                   />
                   <ZAxis type="number" dataKey="z" range={[100, 400]} />
                   <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                   <Scatter name="Assets" data={riskData}>
                      {riskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.type === 'New' ? '#4f46e5' : '#94a3b8'} />
                      ))}
                   </Scatter>
                 </ScatterChart>
               </ResponsiveContainer>
             </div>
             <div className="flex gap-4 justify-center text-xs">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                    <span className="font-bold text-slate-700">{candidate.symbol} (New)</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                    <span className="text-slate-500">Current Portfolio</span>
                </div>
             </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-3 rounded-lg font-bold text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="px-8 py-3 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center gap-2"
          >
            <Icons.CheckCircle className="w-5 h-5" /> Confirm & Add to Simulation
          </button>
        </div>
      </div>
    </div>
  );
};
