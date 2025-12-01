
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: TransactionType;
}

export interface CreditCard {
  id: string;
  name: string;
  cashbackRate: number; // e.g. 0.02 for 2%
  annualFee: number;
  interestRate: number; // APR
}

export interface Loan {
  id: string;
  name: string;
  principal: number;
  remainingBalance: number;
  interestRate: number;
  monthlyPayment: number;
  termMonths: number;
}

export interface Investment {
  id: string;
  name: string;
  balance: number;
  annualReturnRate: number; // e.g., 7.0 for 7%
  monthlyContribution: number;
}

export interface FinancialState {
  cashBalance: number;
  monthlyIncome: number;
  transactions: Transaction[];
  creditCards: CreditCard[];
  loans: Loan[];
  investments: Investment[];
}

export interface SimulationConfig {
  active: boolean;
  scenarioName: string;
  projectedMonths: number;
}

export interface AIAnalysisResult {
  summary: string;
  recommendations: string[];
  score: number; // 0-100 financial health score
}

export interface InvestmentSuggestion {
  symbol: string;
  name: string;
  type: 'Stock' | 'Crypto' | 'Commodity' | 'ETF' | 'Bond';
  riskLevel: 'High' | 'Medium' | 'Low';
  reasoning: string;
  estimatedReturn: string; // e.g., "8-10%"
}

export interface MarketPulseData {
  sentiment: 'Bullish' | 'Bearish' | 'Neutral' | 'Volatile';
  sentimentScore: number; // 0-100
  factors: {
    name: string;
    trend: 'Up' | 'Down' | 'Stable';
    description: string;
  }[];
  sectors: {
    name: string;
    sentiment: number; // 1-10
  }[];
  news: {
    headline: string;
    summary: string;
  }[];
  sources: any[];
}

// Helper types for charts
export interface MonthlyData {
  month: string;
  actualSavings: number;
  simulatedSavings?: number;
  actualNetWorth: number;
  simulatedNetWorth?: number;
  investmentValue?: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
