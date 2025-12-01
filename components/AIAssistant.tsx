
import React, { useState, useEffect, useRef } from 'react';
import { analyzeFinancialScenario, createFinancialChat } from '../services/geminiService';
import { FinancialState, AIAnalysisResult, ChatMessage } from '../types';
import { Icons } from './Icons';
import { Chat, GenerateContentResponse } from "@google/genai";

interface AIAssistantProps {
  current: FinancialState;
  simulated: FinancialState | null;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ current, simulated }) => {
  const [activeTab, setActiveTab] = useState<'report' | 'chat'>('report');
  
  // Report State
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  // Chat State
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize/Reset Chat when context changes significantly (e.g. simulation toggled)
  useEffect(() => {
    const session = createFinancialChat(current, simulated);
    setChatSession(session);
    setMessages([
        {
            role: 'model',
            text: simulated 
              ? "I'm ready to discuss your simulated scenario. Ask me about the impact of these changes!" 
              : "Hello! I've analyzed your current finances. Ask me anything about your spending, debts, or savings.",
            timestamp: Date.now()
        }
    ]);
  }, [current, simulated]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  const handleAnalyze = async () => {
    setLoadingAnalysis(true);
    const result = await analyzeFinancialScenario(current, simulated);
    setAnalysis(result);
    setLoadingAnalysis(false);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !chatSession) return;

    const userMsg: ChatMessage = { role: 'user', text: inputText, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
        const response: GenerateContentResponse = await chatSession.sendMessage({ message: userMsg.text });
        const text = response.text || "I'm having trouble connecting right now.";
        
        setMessages(prev => [...prev, { role: 'model', text, timestamp: Date.now() }]);
    } catch (e) {
        setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please check your API key.", timestamp: Date.now() }]);
    } finally {
        setIsTyping(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden">
      
      {/* Header Tabs */}
      <div className="flex border-b border-slate-100">
        <button 
            onClick={() => setActiveTab('report')}
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'report' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
        >
            <Icons.Chart className="w-4 h-4" /> Health Report
        </button>
        <button 
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'chat' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
        >
            <Icons.MessageSquare className="w-4 h-4" /> AI Chat
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        
        {/* ================= REPORT TAB ================= */}
        {activeTab === 'report' && (
             <div className="h-full flex flex-col p-6 overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="font-bold text-slate-800">Financial Analysis</h3>
                        <p className="text-xs text-slate-500">Deep dive into your portfolio</p>
                    </div>
                    <button 
                    onClick={handleAnalyze}
                    disabled={loadingAnalysis}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        loadingAnalysis 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                    }`}
                    >
                    {loadingAnalysis ? 'Analyzing...' : 'Refresh Analysis'}
                    </button>
                </div>

                {analysis ? (
                <div className="space-y-6 animate-fadeIn">
                    {/* Score */}
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="relative w-14 h-14 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="28" cy="28" r="24" stroke="#e2e8f0" strokeWidth="5" fill="transparent" />
                                <circle 
                                cx="28" cy="28" r="24" 
                                stroke={analysis.score > 70 ? '#10b981' : analysis.score > 40 ? '#f59e0b' : '#f43f5e'} 
                                strokeWidth="5" 
                                fill="transparent" 
                                strokeDasharray={150.8}
                                strokeDashoffset={150.8 - (150.8 * analysis.score) / 100}
                                className="transition-all duration-1000 ease-out"
                                />
                            </svg>
                            <span className="absolute text-sm font-bold text-slate-700">{analysis.score}</span>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-700">Health Score</h4>
                            <p className="text-xs text-slate-500">{simulated ? "projected" : "current"}</p>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-50">
                        <p className="text-slate-700 text-sm leading-relaxed">{analysis.summary}</p>
                    </div>

                    {/* Recommendations */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Action Plan</h4>
                        <ul className="space-y-3">
                            {analysis.recommendations.map((rec, i) => (
                            <li key={i} className="flex gap-3 items-start">
                                <div className="mt-0.5 min-w-[18px] h-[18px] rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-[10px] font-bold">
                                {i + 1}
                                </div>
                                <span className="text-sm text-slate-600">{rec}</span>
                            </li>
                            ))}
                        </ul>
                    </div>
                </div>
                ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 p-4">
                    <Icons.AI className="w-10 h-10 mb-3 opacity-20" />
                    <p className="text-sm max-w-[200px]">Click "Refresh Analysis" to get a full report on your finances.</p>
                </div>
                )}
             </div>
        )}

        {/* ================= CHAT TAB ================= */}
        {activeTab === 'chat' && (
            <div className="h-full flex flex-col">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 custom-scrollbar">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                    {msg.role === 'user' ? <Icons.User className="w-4 h-4" /> : <Icons.Bot className="w-4 h-4" />}
                                </div>
                                <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                    msg.role === 'user' 
                                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                                      : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                         <div className="flex justify-start">
                            <div className="flex gap-2">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                    <Icons.Bot className="w-4 h-4" />
                                </div>
                                <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-tl-none flex gap-1 items-center">
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                                </div>
                            </div>
                         </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-slate-100">
                    <div className="relative">
                        <input 
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Ask about your budget..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-full pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                        />
                        <button 
                            onClick={handleSendMessage}
                            disabled={!inputText.trim() || isTyping}
                            className="absolute right-1 top-1 bottom-1 w-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                        >
                            <Icons.Send className="w-4 h-4 ml-0.5" />
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default AIAssistant;
