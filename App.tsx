import React, { useState } from 'react';
import { InputForm } from './components/InputForm';
import { StatusStepper } from './components/StatusStepper';
import { ReportView } from './components/ReportView';
import { ResearchInput, ResearchState } from './types';
import { performGeneralSearch, analyzeProvidedUrls, generateFinalReport } from './services/gemini';
import { Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [researchState, setResearchState] = useState<ResearchState>({
    step: 'idle',
    searchResult: '',
    searchSources: [],
    urlAnalysisResult: '',
    finalReport: ''
  });

  const handleStartResearch = async (input: ResearchInput) => {
    // Reset state
    setResearchState({
      step: 'searching',
      searchResult: '',
      searchSources: [],
      urlAnalysisResult: '',
      finalReport: '',
      error: undefined
    });

    try {
      // Step 1: Search
      console.log('Starting search...');
      const searchRes = await performGeneralSearch(input.productName, input.language);
      
      setResearchState(prev => ({
        ...prev,
        step: 'analyzing_urls',
        searchResult: searchRes.text,
        searchSources: searchRes.sources
      }));

      // Step 2: Analyze URLs
      let urlResText = "";
      if (input.urls.length > 0) {
        console.log('Analyzing URLs...');
        urlResText = await analyzeProvidedUrls(input.productName, input.urls, input.language);
      } else {
        urlResText = input.language === 'English' ? "No specific URLs provided." : "未提供具体URL。";
      }

      setResearchState(prev => ({
        ...prev,
        step: 'generating_report',
        urlAnalysisResult: urlResText
      }));

      // Step 3: Generate Report
      console.log('Generating report...');
      const report = await generateFinalReport(input.productName, searchRes.text, urlResText, input.language);

      setResearchState(prev => ({
        ...prev,
        step: 'complete',
        finalReport: report
      }));

    } catch (error: any) {
      console.error(error);
      setResearchState(prev => ({
        ...prev,
        step: 'error',
        error: error.message || "An unexpected error occurred during research."
      }));
    }
  };

  const handleReset = () => {
    setResearchState({
      step: 'idle',
      searchResult: '',
      searchSources: [],
      urlAnalysisResult: '',
      finalReport: ''
    });
  };

  const showResults = researchState.step !== 'idle';
  const showInput = researchState.step === 'idle';

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 pb-20 font-sans">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleReset}>
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700 tracking-tight">
              AI Product Research
            </h1>
          </div>
          
          {/* New Research Button (Only visible when not idle) */}
          {researchState.step !== 'idle' && (
            <button
              onClick={handleReset}
              className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-all shadow-sm hover:shadow"
            >
              <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              <span className="font-semibold text-sm">Start New Research</span>
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Intro Text - Only on idle */}
        {researchState.step === 'idle' && (
          <div className="text-center mb-12 max-w-3xl mx-auto animate-[fadeIn_0.5s_ease-out]">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
              Master Your Market Intelligence
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              Enter a product, select your language, and let Gemini conduct a deep-dive investigation. 
              Get comprehensive reports, real-time search data, and specific URL analysis in seconds.
            </p>
          </div>
        )}

        {/* Input Section */}
        {showInput && (
          <div className="animate-[slideUp_0.5s_ease-out]">
            <InputForm 
              onSubmit={handleStartResearch} 
              isLoading={false}
            />
          </div>
        )}

        {/* Results View - Shown immediately after start */}
        {showResults && !researchState.error && (
          <div className="animate-[fadeIn_0.5s_ease-out]">
            <StatusStepper state={researchState.step} />
            
            <div className="mt-8">
               <ReportView 
                 report={researchState.finalReport}
                 searchData={researchState.searchResult}
                 urlData={researchState.urlAnalysisResult}
                 sources={researchState.searchSources}
                 currentStep={researchState.step}
               />
            </div>
          </div>
        )}

        {/* Error Message */}
        {researchState.step === 'error' && (
          <div className="max-w-2xl mx-auto mt-8 p-6 bg-red-50 border border-red-200 rounded-xl flex items-start gap-4 text-red-800 shadow-sm animate-[shake_0.5s_ease-in-out]">
            <div className="bg-red-100 p-2 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">Research Interrupted</h3>
              <p className="text-red-700">{researchState.error}</p>
              <button 
                onClick={handleReset}
                className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-sm font-semibold transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;