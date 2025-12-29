import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { TabOption, ResearchState } from '../types';
import { FileText, Globe, Link, Copy, Check, Loader2, ExternalLink } from 'lucide-react';

interface ReportViewProps {
  report: string;
  searchData: string;
  urlData: string;
  sources: string[];
  currentStep: ResearchState['step'];
}

export const ReportView: React.FC<ReportViewProps> = ({ 
  report, 
  searchData, 
  urlData, 
  sources,
  currentStep
}) => {
  const [activeTab, setActiveTab] = useState<TabOption>(TabOption.SEARCH_DATA);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (currentStep === 'searching' || currentStep === 'analyzing_urls') {
      if (!report && !urlData && searchData) {
         setActiveTab(TabOption.SEARCH_DATA);
      }
    }
    if (currentStep === 'complete') {
        setActiveTab(TabOption.REPORT);
    }
  }, [currentStep, searchData, urlData, report]);


  const handleCopy = () => {
    let content = "";
    if (activeTab === TabOption.REPORT) content = report;
    if (activeTab === TabOption.SEARCH_DATA) content = searchData;
    if (activeTab === TabOption.URL_DATA) content = urlData;

    if (!content) return;

    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isTabLoading = (tab: TabOption) => {
    if (tab === TabOption.SEARCH_DATA) return currentStep === 'searching' && !searchData;
    if (tab === TabOption.URL_DATA) return (currentStep === 'searching' || currentStep === 'analyzing_urls') && !urlData;
    if (tab === TabOption.REPORT) return currentStep !== 'complete' && !report;
    return false;
  };

  const TabButton = ({ id, label, icon: Icon }: { id: TabOption, label: string, icon: any }) => {
    const isLoading = isTabLoading(id);
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all duration-200 outline-none ${
          activeTab === id
            ? 'border-blue-600 text-blue-600 bg-blue-50/50'
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
        }`}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
        {label}
      </button>
    );
  };

  // Custom styling components for Markdown
  const MarkdownComponents = {
    h1: (props: any) => <h1 className="text-3xl font-extrabold text-slate-900 mb-6 mt-8 pb-3 border-b border-slate-200" {...props} />,
    h2: (props: any) => <h2 className="text-2xl font-bold text-slate-800 mt-8 mb-4 flex items-center gap-2" {...props} />,
    h3: (props: any) => <h3 className="text-xl font-bold text-slate-800 mt-6 mb-3" {...props} />,
    h4: (props: any) => <h4 className="text-lg font-bold text-slate-800 mt-4 mb-2" {...props} />,
    p: (props: any) => <p className="text-slate-600 leading-relaxed mb-4" {...props} />,
    ul: (props: any) => <ul className="list-disc list-outside ml-5 space-y-1 mb-4 text-slate-600" {...props} />,
    ol: (props: any) => <ol className="list-decimal list-outside ml-5 space-y-1 mb-4 text-slate-600" {...props} />,
    li: (props: any) => <li className="pl-1" {...props} />,
    a: (props: any) => (
      <a 
        className="text-blue-600 hover:text-blue-800 underline decoration-blue-300 hover:decoration-blue-800 transition-colors inline-flex items-center gap-0.5" 
        target="_blank" 
        rel="noopener noreferrer" 
        {...props} 
      >
        {props.children}
        <ExternalLink className="w-3 h-3 opacity-50" />
      </a>
    ),
    blockquote: (props: any) => (
      <blockquote className="border-l-4 border-blue-500 bg-blue-50 pl-4 py-3 italic text-slate-700 my-4 rounded-r-lg shadow-sm" {...props} />
    ),
    code: (props: any) => {
      const { inline, ...rest } = props;
      return inline 
        ? <code className="bg-slate-100 text-pink-600 rounded px-1.5 py-0.5 text-sm font-mono border border-slate-200" {...rest} />
        : <pre className="bg-slate-800 text-slate-50 p-4 rounded-lg overflow-x-auto mb-4 mt-2 shadow-inner"><code className="font-mono text-sm" {...rest} /></pre>;
    },
    hr: (props: any) => <hr className="my-8 border-slate-200" {...props} />,
    table: (props: any) => <div className="overflow-x-auto mb-6 shadow-sm rounded-lg border border-slate-200"><table className="min-w-full divide-y divide-slate-200" {...props} /></div>,
    th: (props: any) => <th className="px-4 py-3 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200" {...props} />,
    td: (props: any) => <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 border-b border-slate-100 bg-white" {...props} />,
  };

  const renderContent = () => {
    let content = "";
    let isLoading = false;
    let emptyMessage = "No data available yet.";

    if (activeTab === TabOption.REPORT) {
      content = report;
      isLoading = !report;
      emptyMessage = "Generating comprehensive report...";
    } else if (activeTab === TabOption.SEARCH_DATA) {
      content = searchData;
      isLoading = !searchData;
      emptyMessage = "Searching the web for information...";
    } else if (activeTab === TabOption.URL_DATA) {
      content = urlData;
      isLoading = !urlData;
      emptyMessage = "Waiting to analyze URLs...";
      if (currentStep === 'complete' && !urlData) emptyMessage = "No specific URLs were provided for analysis.";
    }

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
          <p className="text-sm font-medium animate-pulse">{emptyMessage}</p>
        </div>
      );
    }

    if (!content) {
       return (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <p className="text-sm">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto pb-10">
        <div className="max-w-none">
          <ReactMarkdown components={MarkdownComponents}>
            {content}
          </ReactMarkdown>
        </div>
        
        {activeTab === TabOption.REPORT && sources.length > 0 && (
          <div className="mt-12 pt-8 border-t border-slate-200 bg-slate-50 -mx-8 px-8 pb-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Globe className="w-3 h-3" />
              Cited Sources
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sources.map((src, i) => (
                <a 
                  key={i}
                  href={src} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center gap-3 p-3 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div className="bg-blue-50 p-2 rounded-md group-hover:bg-blue-100 transition-colors shrink-0">
                    <Globe className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-500 mb-0.5">Source {i + 1}</div>
                    <div className="text-xs text-slate-700 font-medium truncate">{new URL(src).hostname}</div>
                  </div>
                  <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-blue-400" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col h-[800px] transition-all duration-500">
      {/* Header / Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-center border-b border-slate-200 bg-white px-2 shadow-sm z-10">
        <div className="flex overflow-x-auto w-full sm:w-auto scrollbar-hide">
          <TabButton id={TabOption.SEARCH_DATA} label="1. Search Findings" icon={Globe} />
          <TabButton id={TabOption.URL_DATA} label="2. URL Analysis" icon={Link} />
          <TabButton id={TabOption.REPORT} label="3. Final Report" icon={FileText} />
        </div>
        <div className="p-2 w-full sm:w-auto flex justify-end">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-blue-200 hover:text-blue-600 transition-all text-slate-600 shadow-sm active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-grow overflow-y-auto p-8 bg-white markdown-body scroll-smooth">
        {renderContent()}
      </div>
    </div>
  );
};