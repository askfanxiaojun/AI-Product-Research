import React from 'react';
import { Search, Link, FileText, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { ResearchState } from '../types';

interface StatusStepperProps {
  state: ResearchState['step'];
}

export const StatusStepper: React.FC<StatusStepperProps> = ({ state }) => {
  const steps = [
    { id: 'searching', label: 'Searching Web', description: 'Gathering global intelligence', icon: Search },
    { id: 'analyzing_urls', label: 'Analyzing URLs', description: 'Processing specific sources', icon: Link },
    { id: 'generating_report', label: 'Writing Report', description: 'Synthesizing final insights', icon: FileText },
  ];

  const getStepStatus = (stepId: string) => {
    const stepOrder = ['idle', 'searching', 'analyzing_urls', 'generating_report', 'complete'];
    const currentIndex = stepOrder.indexOf(state);
    const stepIndex = stepOrder.indexOf(stepId);

    if (state === 'error') return 'waiting';
    if (state === 'complete') return 'completed';
    if (currentIndex > stepIndex) return 'completed';
    if (currentIndex === stepIndex) return 'active';
    return 'waiting';
  };

  return (
    <div className="w-full max-w-5xl mx-auto mb-10 px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((step, idx) => {
          const status = getStepStatus(step.id);
          const Icon = step.icon;
          const isActive = status === 'active';
          const isCompleted = status === 'completed';

          return (
            <div 
              key={step.id} 
              className={`relative overflow-hidden rounded-xl p-4 border-2 transition-all duration-500 ${
                isActive 
                  ? 'bg-white border-blue-500 shadow-lg shadow-blue-100' 
                  : isCompleted 
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-slate-100 opacity-60'
              }`}
            >
              {/* Progress Bar Background for Active State */}
              {isActive && (
                <div className="absolute bottom-0 left-0 h-1 bg-blue-100 w-full">
                  <div className="h-full bg-blue-500 animate-[loading_2s_ease-in-out_infinite] w-1/3"></div>
                </div>
              )}

              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                   isActive 
                    ? 'bg-blue-100 text-blue-600'
                    : isCompleted
                      ? 'bg-green-100 text-green-600'
                      : 'bg-slate-100 text-slate-400'
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : isActive ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-bold text-sm ${isActive || isCompleted ? 'text-slate-900' : 'text-slate-500'}`}>
                      {step.label}
                    </h3>
                    {isActive && <span className="text-xs font-semibold text-blue-600 animate-pulse">Processing...</span>}
                    {isCompleted && <span className="text-xs font-semibold text-green-600">Done</span>}
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Connector Arrow (Desktop only) */}
              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-slate-50 rounded-full p-1 border border-slate-200">
                  <ArrowRight className={`w-3 h-3 ${isCompleted ? 'text-green-500' : 'text-slate-300'}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
