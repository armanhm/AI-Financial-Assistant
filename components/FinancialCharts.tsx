import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { FinancialState, MonthlyData } from '../types';

export const generateProjectionData = (state: FinancialState, months: number): MonthlyData[] => {
  const data: MonthlyData[] = [];
  
  // Clone initial values to avoid mutating state
  let currentCash = state.cashBalance;
  
  // Create deep copies of dynamic assets/liabilities for the projection loop
  let activeLoans = state.loans.map(l => ({ ...l }));
  let activeInvestments = state.investments.map(i => ({ ...i }));

  // Calculate base monthly stats
  // 1. Monthly Income
  const monthlyIncome = state.transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0) || state.monthlyIncome; // Fallback if no tx

  // 2. Monthly Expenses
  const monthlyExpenses = state.transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  // 3. Cashback Impact (Estimate based on highest card rate applied to expenses)
  const maxCashbackRate = state.creditCards.reduce((max, card) => Math.max(max, card.cashbackRate), 0);
  const estimatedMonthlyCashback = monthlyExpenses * (maxCashbackRate / 100);

  for (let i = 0; i <= months; i++) {
    // A. Snapshot current net worth elements
    const totalLoanBalance = activeLoans.reduce((acc, l) => acc + l.remainingBalance, 0);
    const totalInvestmentValue = activeInvestments.reduce((acc, inv) => acc + inv.balance, 0);
    
    data.push({
      month: `M${i}`,
      actualSavings: currentCash, // Using 'actualSavings' field to map to Cash Balance
      actualNetWorth: currentCash + totalInvestmentValue - totalLoanBalance,
      investmentValue: totalInvestmentValue
    });

    if (i === months) break; // Don't project past the last month

    // B. Process Monthly Flow
    
    // 1. Inflows
    currentCash += monthlyIncome;
    currentCash += estimatedMonthlyCashback;

    // 2. Outflows (Expenses)
    currentCash -= monthlyExpenses;

    // 3. Loans (Amortization)
    activeLoans.forEach(loan => {
      if (loan.remainingBalance > 0) {
        // Simple monthly interest
        const interest = loan.remainingBalance * (loan.interestRate / 100 / 12);
        const principalPayment = loan.monthlyPayment - interest;
        
        // Deduct full payment from cash
        currentCash -= loan.monthlyPayment;
        
        // Reduce loan balance
        loan.remainingBalance -= principalPayment;
        if (loan.remainingBalance < 0) loan.remainingBalance = 0;
      }
    });

    // 4. Investments (Contributions + Growth)
    activeInvestments.forEach(inv => {
      // Deduct contribution from cash
      currentCash -= inv.monthlyContribution;
      
      // Add to investment
      inv.balance += inv.monthlyContribution;
      
      // Apply monthly growth (Compound Interest)
      const monthlyRate = inv.annualReturnRate / 100 / 12;
      inv.balance += inv.balance * monthlyRate;
    });
  }

  return data;
};

interface NetWorthChartProps {
  current: FinancialState;
  simulated: FinancialState | null;
}

export const NetWorthChart: React.FC<NetWorthChartProps> = ({ current, simulated }) => {
  const months = 12;
  const currentData = generateProjectionData(current, months);
  const simulatedData = simulated ? generateProjectionData(simulated, months) : [];

  // Merge data for the chart
  const mergedData = currentData.map((d, i) => ({
    name: d.month,
    Current: d.actualNetWorth,
    Simulated: simulatedData[i]?.actualNetWorth
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={mergedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorSim" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{fill: '#94a3b8', fontSize: 12}} 
            tickFormatter={(value) => `$${value / 1000}k`}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value: number) => [`$${Math.round(value).toLocaleString()}`, 'Net Worth']}
          />
          <Area 
            type="monotone" 
            dataKey="Current" 
            stroke="#10b981" 
            fillOpacity={1} 
            fill="url(#colorCurrent)" 
            strokeWidth={2}
          />
          {simulated && (
            <Area 
              type="monotone" 
              dataKey="Simulated" 
              stroke="#6366f1" 
              fillOpacity={1} 
              fill="url(#colorSim)" 
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

interface ExpenseProps {
  transactions: any[];
}

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

export const ExpenseBreakdown: React.FC<ExpenseProps> = ({ transactions }) => {
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc: any, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const data = Object.keys(expensesByCategory).map(key => ({
    name: key,
    value: expensesByCategory[key]
  }));

  return (
    <div className="h-[250px] w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};