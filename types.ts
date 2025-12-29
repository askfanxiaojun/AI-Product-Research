export interface ResearchState {
  step: 'idle' | 'searching' | 'analyzing_urls' | 'generating_report' | 'complete' | 'error';
  searchResult: string;
  searchSources: string[];
  urlAnalysisResult: string;
  finalReport: string;
  error?: string;
}

export interface ResearchInput {
  productName: string;
  urls: string[];
  language: string;
}

export enum TabOption {
  REPORT = 'REPORT',
  SEARCH_DATA = 'SEARCH_DATA',
  URL_DATA = 'URL_DATA'
}
