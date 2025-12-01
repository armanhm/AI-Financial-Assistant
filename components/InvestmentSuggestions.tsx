
import React, { useState, useEffect } from 'react';
import { InvestmentSuggestion, Investment, MarketPulseData } from '../types';
import { getInvestmentSuggestions, getTrendingFinancialNews } from '../services/geminiService';
import { Icons } from './Icons';
import { InvestmentSimulatorModal } from './InvestmentSimulatorModal';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';

interface InvestmentSuggestionsProps {
  onAddAsset: (suggestion: InvestmentSuggestion) => void;
  currentInvestments?: Investment[]; 
}

const InvestmentSuggestions: React.FC<InvestmentSuggestionsProps> = ({ onAddAsset, currentInvestments = [] }) => {
  const [risk, setRisk] = useState<string>('Medium');
  const [term, setTerm] = useState<string>('Mid');
  const [suggestions, setSuggestions] = useState<InvestmentSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<InvestmentSuggestion | null>(null);

  // Market Pulse State
  const [marketData, setMarketData] = useState<MarketPulseData | null>(null);
  const [loadingNews, setLoadingNews] = useState(true);

  // Fetch News on Mount
  useEffect(() => {
    const fetchNews = async () => {
      setLoadingNews(true);
      const data = await getTrendingFinancialNews();
      setMarketData(data);
      setLoadingNews(false);
    };
    fetchNews();
  }, []);

  const fetchSuggestions = async () => {
    setLoading(true);
    setSuggestions([]);
    const results = await getInvestmentSuggestions(risk, term);
    setSuggestions(results);
    setLoading(false);
    setGenerated(true);
  };

  const getRiskColor = (r: string) => {
    switch(r.toLowerCase()) {
      case 'high': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
        case 'Crypto': return <Icons.Bitcoin className="w-5 h-5 text-indigo-500" />;
        case 'Commodity': return <Icons.Gem className="w-5 h-5 text-amber-500" />;
        case 'Bond': return <Icons.Leaf className="w-5 h-5 text-emerald-500" />;
        default: return <Icons.TrendingUp className="w-5 h-5 text-blue-500" />;
    }
  };

  // Render Helpers for Market Pulse
  const renderSentimentGauge = (score: number) => {
    const data = [
        { name: 'Score', value: score },
        { name: 'Remainder', value: 100 - score }
    ];
    // Color scale from Red (0) to Green (100)
    const color = score < 30 ? '#f43f5e' : score < 60 ? '#f59e0b' : '#10b981';

    return (
        <div className="h-[120px] w-full relative flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="100%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={0}
                        dataKey="value"
                    >
                        <Cell key="score" fill={color} />
                        <Cell key="remainder" fill="#e2e8f0" />
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute bottom-0 flex flex-col items-center">
                 <span className="text-2xl font-bold text-slate-800">{score}</span>
                 <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Fear / Greed</span>
            </div>
        </div>
    );
  };

  const renderSectorChart = (sectors: {name: string, sentiment: number}[]) => {
     return (
        <div className="h-[140px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sectors} layout="vertical" margin={{top:5, right:20, left:20, bottom:5}}>
                    <XAxis type="number" domain={[0, 10]} hide />
                    <Tooltip 
                        contentStyle={{borderRadius: '6px', fontSize: '12px'}} 
                        cursor={{fill: 'transparent'}}
                    />
                    <Bar dataKey="sentiment" radius={[0, 4, 4, 0]}>
                        {sectors.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.sentiment > 7 ? '#10b981' : entry.sentiment > 4 ? '#6366f1' : '#f43f5e'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
     );
  };

  return (
    <div className="space-y-6 animate-fadeIn relative">
      
      {/* Simulation Modal */}
      {selectedAsset && (
        <InvestmentSimulatorModal 
            candidate={selectedAsset}
            currentInvestments={currentInvestments}
            onClose={() => setSelectedAsset(null)}
            onConfirm={() => {
                onAddAsset(selectedAsset);
                setSelectedAsset(null);
            }}
        />
      )}

      {/* 1. NEW VISUAL MARKET PULSE */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <Icons.Activity className="w-5 h-5 text-indigo-400 animate-pulse" />
                <h3 className="font-bold text-lg">Global Market Pulse</h3>
            </div>
            <div className="flex items-center gap-3">
                 <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">Live Data</span>
                 <div className="flex items-center gap-1 text-xs text-slate-400">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Google Search
                 </div>
            </div>
        </div>

        {loadingNews || !marketData ? (
             <div className="p-8 space-y-4">
                <div className="flex gap-4">
                    <div className="w-1/3 h-32 bg-slate-100 rounded-lg animate-pulse"></div>
                    <div className="w-1/3 h-32 bg-slate-100 rounded-lg animate-pulse"></div>
                    <div className="w-1/3 h-32 bg-slate-100 rounded-lg animate-pulse"></div>
                </div>
                <div className="w-full h-8 bg-slate-100 rounded animate-pulse"></div>
             </div>
        ) : (
            <div className="p-6 grid grid-cols-12 gap-6">
                
                {/* 1.1 Sentiment Column (3 Cols) */}
                <div className="col-span-3 flex flex-col items-center justify-center border-r border-slate-100 pr-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Market Sentiment</h4>
                    <div className="mb-2">
                       {renderSentimentGauge(marketData.sentimentScore)}
                    </div>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                        marketData.sentiment === 'Bullish' ? 'bg-emerald-100 text-emerald-700' : 
                        marketData.sentiment === 'Bearish' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                        {marketData.sentiment}
                    </span>
                </div>

                {/* 1.2 Macro Factors (5 Cols) */}
                <div className="col-span-5 px-4 border-r border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Key Economic Factors</h4>
                    <div className="space-y-3">
                        {marketData.factors.map((factor, i) => (
                            <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100 hover:border-indigo-100 transition-colors">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm text-slate-700">{factor.name}</span>
                                        <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{factor.description}</span>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${
                                    factor.trend === 'Up' ? 'bg-emerald-100 text-emerald-700' : 
                                    factor.trend === 'Down' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'
                                }`}>
                                    {factor.trend === 'Up' && <Icons.TrendingUp className="w-3 h-3" />}
                                    {factor.trend === 'Down' && <Icons.TrendingDown className="w-3 h-3" />}
                                    {factor.trend === 'Stable' && <Icons.Minus className="w-3 h-3" />}
                                    {factor.trend}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 1.3 Sector Heatmap (4 Cols) */}
                <div className="col-span-4 pl-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sector Trend (Sentiment)</h4>
                    {renderSectorChart(marketData.sectors)}
                    <div className="flex justify-between px-2 text-[10px] text-slate-400 font-mono mt-1">
                        {marketData.sectors.map(s => <span key={s.name}>{s.name}</span>)}
                    </div>
                </div>

                {/* 1.4 News Ticker (Full Width) */}
                <div className="col-span-12 mt-4 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Icons.Newspaper className="w-4 h-4" /> Top Stories
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                        {marketData.news.map((item, idx) => (
                            <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-100 hover:shadow-sm transition-shadow">
                                <span className="text-[10px] bg-white border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded mb-2 inline-block">Breaking</span>
                                <h5 className="font-bold text-xs text-slate-800 mb-1 leading-snug line-clamp-2">{item.headline}</h5>
                                <p className="text-[10px] text-slate-500 line-clamp-2">{item.summary}</p>
                            </div>
                        ))}
                    </div>
                    {/* Sources Link */}
                    {marketData.sources.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2 justify-end">
                            {marketData.sources.slice(0, 3).map((source, i) => (
                                source.web?.uri && (
                                    <a key={i} href={source.web.uri} target="_blank" rel="noopener noreferrer" 
                                       className="flex items-center gap-1 text-[10px] text-indigo-500 hover:underline bg-indigo-50 px-2 py-0.5 rounded">
                                       <Icons.ExternalLink className="w-3 h-3" /> {source.web.title || "Read More"}
                                    </a>
                                )
                            ))}
                        </div>
                    )}
                </div>

            </div>
        )}
      </div>

      {/* 2. Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-start justify-between mb-8">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    <Icons.Target className="w-8 h-8 text-indigo-600" />
                    AI Investment Planner
                </h2>
                <p className="text-slate-500 mt-2 max-w-2xl">
                    Generate tailored investment portfolios based on your risk tolerance and time horizon. 
                    Includes analysis for Stocks, Crypto, and Commodities.
                </p>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-8 max-w-4xl">
            {/* Risk Selector */}
            <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Risk Profile</label>
                <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                    {['Low', 'Medium', 'High'].map((r) => (
                        <button
                            key={r}
                            onClick={() => setRisk(r)}
                            className={`flex-1 py-3 rounded-md text-sm font-medium transition-all ${
                                risk === r 
                                    ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200' 
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {r} Risk
                        </button>
                    ))}
                </div>
                <p className="text-xs text-slate-400 mt-2 pl-1">
                    {risk === 'Low' && "Prioritizes capital preservation. Best for short-term goals."}
                    {risk === 'Medium' && "Balanced growth and stability. Standard for most investors."}
                    {risk === 'High' && "Maximum growth potential with higher volatility. Best for long-term."}
                </p>
            </div>

            {/* Term Selector */}
            <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Time Horizon</label>
                <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                    {['Short', 'Mid', 'Long'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTerm(t)}
                            className={`flex-1 py-3 rounded-md text-sm font-medium transition-all ${
                                term === t 
                                    ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200' 
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {t} Term
                        </button>
                    ))}
                </div>
                <p className="text-xs text-slate-400 mt-2 pl-1">
                    {term === 'Short' && "< 1 year. Needs high liquidity."}
                    {term === 'Mid' && "1 - 5 years. Savings for house, car, etc."}
                    {term === 'Long' && "5+ years. Retirement or wealth building."}
                </p>
            </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
            <button 
                onClick={fetchSuggestions}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
                {loading ? (
                    <>
                     <Icons.AI className="w-5 h-5 animate-spin" /> Analyzing Market...
                    </>
                ) : (
                    <>
                     <Icons.AI className="w-5 h-5" /> Generate Suggestions
                    </>
                )}
            </button>
        </div>
      </div>

      {/* 3. Results Grid */}
      {generated && (
        <div className="grid grid-cols-2 gap-6 animate-fadeIn">
            {suggestions.map((asset, idx) => (
                <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                                {getTypeIcon(asset.type)}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">{asset.symbol}</h3>
                                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">{asset.type} • {asset.name}</span>
                            </div>
                        </div>
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border ${getRiskColor(asset.riskLevel)}`}>
                            {asset.riskLevel} Risk
                        </span>
                    </div>
                    
                    <p className="text-slate-600 text-sm leading-relaxed mb-4 min-h-[60px]">
                        {asset.reasoning}
                    </p>
                    
                    <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-between mb-4">
                        <span className="text-xs font-semibold text-slate-500">Est. Annual Return</span>
                        <span className="text-sm font-bold text-emerald-600">{asset.estimatedReturn}</span>
                    </div>

                    <button 
                        onClick={() => setSelectedAsset(asset)}
                        className="w-full border border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                    >
                        <Icons.Plus className="w-4 h-4" /> Add to Simulator
                    </button>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default InvestmentSuggestions;
