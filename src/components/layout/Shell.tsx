import React from 'react';
import type { AppStep } from '@/types';
import { PenTool, Palette, Download, Layers } from 'lucide-react';

interface ShellProps {
    currentStep: AppStep;
    children: React.ReactNode;
}

const steps: { id: AppStep; label: string; icon: React.ElementType }[] = [
    { id: 'manuscript', label: 'Manuscript Architect', icon: PenTool },
    { id: 'visual', label: 'Visual Curation', icon: Palette },
    { id: 'export', label: 'Export & Distribution', icon: Download },
];

export const Shell: React.FC<ShellProps> = ({ currentStep, children }) => {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
            {/* Header */}
            <header className="border-b border-slate-200 bg-white/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Layers className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-xl font-serif font-semibold tracking-wide text-slate-900">
                            LuminaBook <span className="text-indigo-600">AI</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span>Workspace: </span>
                        <span className="text-slate-700 font-medium">Joseph Delgado</span>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-6 py-8">
                {/* Stepper */}
                <div className="mb-12">
                    <div className="flex items-center justify-between max-w-3xl mx-auto relative">
                        {/* Connecting Line */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-200 -z-10" />

                        {steps.map((step, index) => {
                            const isActive = step.id === currentStep;
                            const isPast = steps.findIndex(s => s.id === currentStep) > index;

                            return (
                                <div key={step.id} className="flex flex-col items-center gap-3 bg-slate-50 px-4">
                                    <div
                                        className={`
                      w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                      ${isActive || isPast
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30 ring-4 ring-slate-50'
                                                : 'bg-white border-slate-200 text-slate-400'
                                            }
                    `}
                                    >
                                        <step.icon className="w-5 h-5" />
                                    </div>
                                    <span className={`text-xs font-medium uppercase tracking-wider ${isActive ? 'text-indigo-400' : 'text-slate-500'}`}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Dynamic Content */}
                <div className="flex-1 min-h-[600px] relative">
                    {children}
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 py-6 text-center text-slate-400 text-sm">
                <p>&copy; {new Date().getFullYear()} LuminaBook AI. All rights reserved.</p>
            </footer>
        </div>
    );
};
