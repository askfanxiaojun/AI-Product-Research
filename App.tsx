import React, { useState } from 'react';
import { InputForm } from './components/InputForm';
import { StatusStepper } from './components/StatusStepper';
import { ReportView } from './components/ReportView';
import { SettingsModal } from './components/SettingsModal';
import { ResearchInput, ResearchState, ApiConfig } from './types';
import { performGeneralSearch as geminiSearch, analyzeProvidedUrls as geminiAnalyzeUrls, generateFinalReport as geminiReport } from './services/gemini';
import { performGeneralSearch as customSearch, analyzeProvidedUrls as customAnalyzeUrls, generateFinalReport as customReport } from './services/customApi';
import { Sparkles, AlertCircle, RefreshCw, Settings } from 'lucide-react';

const DEFAULT_API_CONFIG: ApiConfig = {
  provider: 'gemini',
  apiKey: '',
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
  model: '',
};

const App: React.FC = () => {
  const [researchState, setResearchState] = useState<ResearchState>({
    step: 'idle',
    searchResult: '',
    searchSources: [],
    urlAnalysisResult: '',
    finalReport: ''
  });

  const [apiConfig, setApiConfig] = useState<ApiConfig>(DEFAULT_API_CONFIG);
  const [showSettings, setShowSettings] = useState(false);

  const handleStartResearch = async (input: ResearchInput) => {
    setResearchState({
      step: 'searching',
      searchResult: '',
      searchSources: [],
      urlAnalysisResult: '',
      finalReport: '',
      error: undefined
    });

    try {
      const isCustom = apiConfig.provider === 'custom';

      // Step 1: Search
      const searchRes = isCustom
        ? await customSearch(input.productName, input.language, apiConfig)
        : await geminiSearch(input.productName, input.language);

      setResearchState(prev => ({
        ...prev,
        step: 'analyzing_urls',
        searchResult: searchRes.text,
        searchSources: searchRes.sources
      }));

      // Step 2: Analyze URLs
      let urlResText = '';
      if (input.urls.length > 0) {
        urlResText = isCustom
          ? await customAnalyzeUrls(input.productName, input.urls, input.language, apiConfig)
          : await geminiAnalyzeUrls(input.productName, input.urls, input.language);
      } else {
        urlResText = input.language === 'English' ? 'No specific URLs provided.' : '未提供具体URL。';
      }

      setResearchState(prev => ({
        ...prev,
        step: 'generating_report',
        urlAnalysisResult: urlResText
      }));

      // Step 3: Generate Report
      const report = isCustom
        ? await customReport(input.productName, searchRes.text, urlResText, input.language, apiConfig)
        : await geminiReport(input.productName, searchRes.text, urlResText, input.language);

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
        error: error.message || 'An unexpected error occurred during research.'
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

          <div className="flex items-center gap-2">
            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(true)}
              className="group relative flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-all shadow-sm"
              title="AI 引擎设置"
            >
              <Settings className="w-4 h-4" />
              {apiConfig.provider === 'custom' && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full" />
              )}
            </button>

            {/* New Research Button */}
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
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Intro Text */}
        {researchState.step === 'idle' && (
          <div className="text-center mb-12 max-w-3xl mx-auto animate-[fadeIn_0.5s_ease-out]">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
              Master Your Market Intelligence
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              Enter a product, select your language, and let AI conduct a deep-dive investigation.
              Get comprehensive reports, real-time search data, and specific URL analysis in seconds.
            </p>
          </div>
        )}

        {/* Input Section */}
        {showInput && (
          <div className="animate-[slideUp_0.5s_ease-out]">
            <InputForm onSubmit={handleStartResearch} isLoading={false} />
          </div>
        )}

        {/* Results View */}
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

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          config={apiConfig}
          onSave={setApiConfig}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

export default App;
