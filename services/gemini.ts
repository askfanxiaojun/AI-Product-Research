import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to sanitize sources from grounding metadata
const extractSources = (response: any): string[] => {
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  return chunks
    .map((chunk: any) => chunk.web?.uri)
    .filter((uri: string | undefined) => !!uri) as string[];
};

export const performGeneralSearch = async (productName: string, language: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Perform a comprehensive web search for the product: "${productName}". 
      Identify its core functionality, target audience, key features, and general market reputation. 
      Provide a detailed summary of what this product is and does based on public information.
      
      IMPORTANT: The output MUST be in ${language}.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    return {
      text: response.text || "No search results found.",
      sources: extractSources(response)
    };
  } catch (error) {
    console.error("Search Error:", error);
    throw new Error("Failed to perform general product search.");
  }
};

export const analyzeProvidedUrls = async (productName: string, urls: string[], language: string) => {
  if (urls.length === 0) {
    return "";
  }

  try {
    const urlList = urls.join("\n");
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `I have a list of specific URLs related to the product "${productName}". 
      Please use Google Search to find information contained within or related to these specific pages if possible.
      
      URLs to investigate:
      ${urlList}
      
      Extract specific details, pricing, technical specs, or unique selling points found in these specific contexts.
      Summarize the information gathered from these links.
      
      IMPORTANT: The output MUST be in ${language}.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    return response.text || "Could not analyze the provided URLs.";
  } catch (error) {
    console.error("URL Analysis Error:", error);
    throw new Error("Failed to analyze provided URLs.");
  }
};

export const generateFinalReport = async (
  productName: string, 
  searchData: string, 
  urlData: string,
  language: string
) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `You are a Senior Product Researcher. 
      Create a comprehensive Product Research Report for: "${productName}".
      
      Use the following gathered intelligence:
      
      --- SOURCE 1: GENERAL WEB SEARCH ---
      ${searchData}
      
      --- SOURCE 2: PROVIDED URL ANALYSIS ---
      ${urlData}
      
      --- INSTRUCTIONS ---
      Write a professional report in Markdown format.
      The report MUST be written in ${language}.
      
      The report MUST include the following sections (translate section headers to ${language}):
      1. Executive Summary: A brief overview of the product.
      2. Core Functionality: What does it actually do?
      3. Key Features: Bulleted list of capabilities.
      4. Market Analysis: Competitors, positioning, or public reception (if available).
      5. Insights from Provided Links: Specific details extracted from user URLs.
      6. Conclusion: Final verdict.

      Use bolding, lists, and headers to make it readable.
      Do NOT include your internal reasoning trace, just the final report.`,
    });

    return response.text || "Failed to generate report.";
  } catch (error) {
    console.error("Report Generation Error:", error);
    throw new Error("Failed to generate final report.");
  }
};