import React, { useState } from 'react';
import { ApiConfig } from '../types';
import { X, Key, Cpu } from 'lucide-react';

interface SettingsModalProps {
  config: ApiConfig;
  onSave: (config: ApiConfig) => void;
  onClose: () => void;
}

const VOLC_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';

export const SettingsModal: React.FC<SettingsModalProps> = ({ config, onSave, onClose }) => {
  const [provider, setProvider] = useState<'gemini' | 'custom'>(config.provider);
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [baseURL, setBaseURL] = useState(config.baseURL || VOLC_BASE_URL);
  const [model, setModel] = useState(config.model);

  const canSave = provider === 'gemini' || (apiKey.trim() !== '' && model.trim() !== '');

  const handleSave = () => {
    onSave({ provider, apiKey: apiKey.trim(), baseURL: baseURL.trim() || VOLC_BASE_URL, model: model.trim() });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 animate-[slideUp_0.2s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">AI 引擎设置</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Provider Toggle */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">选择 AI 引擎</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setProvider('gemini')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                  provider === 'gemini'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                }`}
              >
                <span className="text-lg leading-none">✦</span>
                <div>
                  <div className="font-semibold text-sm">Gemini</div>
                  <div className="text-xs opacity-60">Google AI Studio</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setProvider('custom')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                  provider === 'custom'
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                }`}
              >
                <Cpu className="w-5 h-5 shrink-0" />
                <div>
                  <div className="font-semibold text-sm">自定义 API</div>
                  <div className="text-xs opacity-60">火山引擎 / OpenAI 兼容</div>
                </div>
              </button>
            </div>
          </div>

          {/* Custom API Fields */}
          {provider === 'custom' && (
            <div className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  API Key <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="填入你的 API Key"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Base URL</label>
                <input
                  type="url"
                  value={baseURL}
                  onChange={(e) => setBaseURL(e.target.value)}
                  placeholder={VOLC_BASE_URL}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition-all text-sm font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Model <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="ep-xxx 或 doubao-pro-32k"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition-all text-sm font-mono"
                />
              </div>

              <p className="text-xs text-slate-400">
                API Key 仅在浏览器本地使用，不会上传至任何服务器。
              </p>
            </div>
          )}

          {provider === 'gemini' && (
            <p className="text-sm text-slate-500 bg-slate-50 rounded-xl px-4 py-3">
              使用 Google AI Studio 提供的 Gemini 模型，需在环境变量中配置 <code className="text-blue-600 font-mono text-xs">GEMINI_API_KEY</code>。
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all ${
              canSave
                ? 'bg-blue-600 hover:bg-blue-700 shadow-sm'
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};
