import React, { useState } from 'react';
import { ResearchInput } from '../types';
import { Plus, Trash2, Search, Link as LinkIcon, Languages } from 'lucide-react';

interface InputFormProps {
  onSubmit: (data: ResearchInput) => void;
  isLoading: boolean;
}

const LANGUAGES = [
  { code: 'Chinese', label: '简体中文' },
  { code: 'English', label: 'English' },
  { code: 'Spanish', label: 'Español' },
  { code: 'Japanese', label: '日本語' },
  { code: 'French', label: 'Français' },
];

export const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  const [productName, setProductName] = useState('');
  const [urls, setUrls] = useState<string[]>(['']);
  const [language, setLanguage] = useState('Chinese');

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const addUrlField = () => {
    setUrls([...urls, '']);
  };

  const removeUrlField = (index: number) => {
    const newUrls = urls.filter((_, i) => i !== index);
    setUrls(newUrls.length ? newUrls : ['']);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrls = urls.filter(u => u.trim() !== '');
    if (!productName.trim()) return;
    
    onSubmit({
      productName,
      urls: cleanUrls,
      language
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 max-w-2xl mx-auto transition-all hover:shadow-2xl">
      <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
        <div className="bg-blue-50 p-2 rounded-lg">
          <Search className="w-6 h-6 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">
          Start Research
        </h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Product Name */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            Product Name or Description <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="e.g., iPhone 15 Pro, or 'A CRM tool for small bakeries'"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
            disabled={isLoading}
          />
        </div>

        {/* URLs */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-700">
            Related URLs (Optional)
          </label>
          <div className="space-y-3">
            {urls.map((url, index) => (
              <div key={index} className="flex gap-2 group">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LinkIcon className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => handleUrlChange(index, e.target.value)}
                    placeholder="https://example.com/product"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeUrlField(index)}
                  className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  disabled={isLoading || urls.length === 1}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addUrlField}
            disabled={isLoading}
            className="mt-2 text-sm flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-semibold px-2 py-1 rounded-md hover:bg-blue-50 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add another URL
          </button>
        </div>

        {/* Language Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            Output Language
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Languages className="h-4 w-4 text-slate-400" />
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none cursor-pointer transition-all duration-200"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !productName.trim()}
          className={`w-full py-4 px-6 rounded-xl font-bold text-lg text-white shadow-lg shadow-blue-500/30 transition-all transform duration-200 ${
            isLoading || !productName.trim()
              ? 'bg-slate-300 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]'
          }`}
        >
          {isLoading ? 'Initializing Research...' : 'Start Deep Research'}
        </button>
      </form>
    </div>
  );
};
