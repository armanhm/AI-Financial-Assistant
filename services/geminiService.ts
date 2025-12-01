
import { GoogleGenAI, Type } from "@google/genai";
import { FinancialState, AIAnalysisResult, InvestmentSuggestion, MarketPulseData } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const analyzeFinancialScenario = async (
  currentState: FinancialState,
  simulatedState: FinancialState | null
): Promise<AIAnalysisResult> => {
  if (!apiKey) {
    return {
      summary: "API Key is missing. Please configure your Gemini API key.",
      recommendations: ["Add API Key to environment."],
      score: 0
    };
  }

  const isSimulation = !!simulatedState;
  
  const systemInstruction = `You are a world-class financial advisor and data analyst. 
  Your goal is to analyze financial states and provide actionable, concise advice.
  When comparing a simulation to a current state, highlight the specific trade-offs (e.g., long-term cost of interest vs short-term liquidity).
  Keep tone professional but encouraging.`;

  const prompt = isSimulation 
    ? `Compare these two financial states. 
       Current State: ${JSON.stringify(currentState)}
       Simulated State (Proposed Changes): ${JSON.stringify(simulatedState)}
       
       Provide:
       1. A summary of the impact of the changes in the simulation.
       2. Specific pros/cons or recommendations.
       3. A financial health score (0-100) for the simulated scenario.`
    : `Analyze this current financial state: ${JSON.stringify(currentState)}
       
       Provide:
       1. A summary of current spending and health.
       2. 3 actionable recommendations to improve savings or reduce debt.
       3. A financial health score (0-100).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            recommendations: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            score: { type: Type.NUMBER }
          },
          required: ["summary", "recommendations", "score"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AIAnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return {
      summary: "Failed to generate analysis. Please try again.",
      recommendations: ["Check network connection", "Verify API limits"],
      score: 50
    };
  }
};

export const generateSpendingInsights = async (transactions: any[]) => {
   if (!apiKey) return "API Key missing.";
   
   try {
     const response = await ai.models.generateContent({
       model: "gemini-2.5-flash",
       contents: `Analyze these recent transactions and categorize the top spending habit risks: ${JSON.stringify(transactions.slice(0, 20))}. Return a short paragraph plain text.`,
     });
     return response.text;
   } catch (e) {
     return "Could not generate insights.";
   }
};

export const getInvestmentSuggestions = async (
  riskLevel: string, 
  term: string
): Promise<InvestmentSuggestion[]> => {
  if (!apiKey) return [];

  const prompt = `Provide 4 diverse investment suggestions for a "${riskLevel}" risk profile with a "${term}" time horizon. 
  Include a mix of Stocks (ETFs or individual), Cryptocurrencies, and Commodities/Bonds if appropriate for the risk level.
  For each, provide a real symbol (e.g. VOO, BTC, GLD), a 2-3 word name, estimated annual return range (e.g. "8-10%"), and a 1 sentence reasoning.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              symbol: { type: Type.STRING },
              name: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["Stock", "Crypto", "Commodity", "ETF", "Bond"] },
              riskLevel: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
              reasoning: { type: Type.STRING },
              estimatedReturn: { type: Type.STRING }
            },
            required: ["symbol", "name", "type", "riskLevel", "reasoning", "estimatedReturn"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Investment advice error", e);
    return [];
  }
};

export const getTrendingFinancialNews = async (): Promise<MarketPulseData> => {
  if (!apiKey) return { 
    sentiment: 'Neutral', 
    sentimentScore: 50, 
    factors: [], 
    sectors: [], 
    news: [], 
    sources: [] 
  };

  try {
    // We cannot use responseMimeType with googleSearch, so we ask for a structured text format that we can parse.
    const prompt = `
      Perform a Google Search to find the latest top financial news, market sentiment, and key economic indicators for today.
      
      Return the analysis in the following strict format with separators:

      ~SENTIMENT~: [Bullish/Bearish/Neutral/Volatile]
      ~SCORE~: [0-100 where 0 is extreme fear, 100 is extreme greed]
      ~FACTOR~: [Factor Name e.g. Inflation] | [Trend: Up/Down/Stable] | [Very short impact description]
      ~FACTOR~: [Factor Name] | [Trend: Up/Down/Stable] | [Description]
      ~FACTOR~: [Factor Name] | [Trend: Up/Down/Stable] | [Description]
      ~SECTOR~: [Sector Name e.g. Tech] | [Score 1-10]
      ~SECTOR~: [Sector Name] | [Score 1-10]
      ~SECTOR~: [Sector Name] | [Score 1-10]
      ~NEWS~: [Headline] | [Summary]
      ~NEWS~: [Headline] | [Summary]
      ~NEWS~: [Headline] | [Summary]

      Limit to 3 factors, 3 sectors, 3 news stories. Ensure data is based on the search results.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text || "";
    const lines = text.split('\n');
    
    // Simple Parser
    let sentiment: any = 'Neutral';
    let sentimentScore = 50;
    const factors: any[] = [];
    const sectors: any[] = [];
    const news: any[] = [];

    lines.forEach(line => {
        if (line.includes('~SENTIMENT~:')) sentiment = line.split(':')[1].trim();
        if (line.includes('~SCORE~:')) sentimentScore = parseInt(line.split(':')[1].trim()) || 50;
        
        if (line.includes('~FACTOR~:')) {
            const parts = line.replace('~FACTOR~:', '').split('|').map(s => s.trim());
            if (parts.length >= 3) {
                factors.push({ name: parts[0], trend: parts[1], description: parts[2] });
            }
        }
        
        if (line.includes('~SECTOR~:')) {
            const parts = line.replace('~SECTOR~:', '').split('|').map(s => s.trim());
            if (parts.length >= 2) {
                sectors.push({ name: parts[0], sentiment: parseInt(parts[1]) || 5 });
            }
        }

        if (line.includes('~NEWS~:')) {
            const parts = line.replace('~NEWS~:', '').split('|').map(s => s.trim());
            if (parts.length >= 2) {
                news.push({ headline: parts[0], summary: parts[1] });
            }
        }
    });

    return {
      sentiment,
      sentimentScore,
      factors,
      sectors,
      news,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (e) {
    console.error("News fetch error", e);
    return { 
        sentiment: 'Neutral', 
        sentimentScore: 50, 
        factors: [{name: 'Error', trend: 'Stable', description: 'Could not fetch live data'}], 
        sectors: [], 
        news: [], 
        sources: [] 
    };
  }
};
