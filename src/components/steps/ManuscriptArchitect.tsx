import React, { useState } from 'react';
import type { EBook } from '@/types';
import { motion } from 'framer-motion';
import { analyzeManuscript } from '@/services/ai-service';
import { Sparkles, ArrowRight, FileText } from 'lucide-react';

interface ManuscriptArchitectProps {
    book: Partial<EBook>;
    setBook: (book: Partial<EBook>) => void;
    onNext: () => void;
}

export const ManuscriptArchitect: React.FC<ManuscriptArchitectProps> = ({ book, setBook, onNext }) => {
    const [text, setText] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [language, setLanguage] = useState<'en' | 'es'>('en');

    const handleAnalyze = async () => {
        if (!text.trim()) return;

        setIsAnalyzing(true);
        try {
            const result = await analyzeManuscript(text, language);
            setBook({ ...book, ...result });
        } catch (error) {
            console.error("Analysis failed", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getChapterLabel = (index: number, title: string) => {
        const lowerTitle = title.toLowerCase();
        const isIntro = lowerTitle.includes('intro') || lowerTitle.includes('prologue') || lowerTitle.includes('prólogo') || lowerTitle.includes('preface') || lowerTitle.includes('prefacio');

        if (isIntro) return null; // No label for intros

        // Calculate actual chapter number (adjusting for previous intros)
        // Simple heuristic: just count it as chapter index for now, but in a real app might need dynamic reducing
        // For this UI, we will just use the index+1 but conditionally hide the label if intro

        const labelStr = language === 'es' ? 'Capítulo' : 'Chapter';
        return `${labelStr} ${index + 1}`;
    };



    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            {/* Input Section */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-serif text-slate-900 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-indigo-600" />
                        Raw Manuscript
                    </h2>
                    <div className="flex items-center gap-2">
                        <div className="bg-slate-100 p-1 rounded-lg flex text-xs font-medium">
                            <button
                                onClick={() => setLanguage('en')}
                                className={`px-3 py-1 rounded-md transition-all ${language === 'en' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                English
                            </button>
                            <button
                                onClick={() => setLanguage('es')}
                                className={`px-3 py-1 rounded-md transition-all ${language === 'es' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Español
                            </button>
                        </div>
                    </div>
                </div>

                <div className="relative group">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={language === 'es' ? "Pegue su manuscrito aquí..." : "Paste your raw text here or upload a file..."}
                        className="w-full bg-white border border-slate-200 rounded-xl p-6 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none font-mono text-sm leading-relaxed min-h-[400px] shadow-sm"
                    />
                    <div className="absolute bottom-4 right-4 flex gap-2">
                        <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 shadow-sm border border-slate-200">
                            <input
                                type="file"
                                className="hidden"
                                accept=".txt,.md,.json"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (e) => setText(e.target?.result as string);
                                        reader.readAsText(file);
                                    }
                                }}
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                            Upload Doc
                        </label>
                    </div>
                </div>

                <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !text.trim()}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 rounded-xl font-medium transition-all flex items-center justify-center gap-2 group cursor-pointer shadow-lg shadow-indigo-500/20 disabled:shadow-none"
                >
                    {isAnalyzing ? (
                        <span className="flex items-center gap-2 animate-pulse text-white">
                            <Sparkles className="w-5 h-5" /> {language === 'es' ? 'Analizando Estructura...' : 'Analyzing Structure...'}
                        </span>
                    ) : (
                        <span className="text-white flex items-center gap-2">
                            <Sparkles className="w-5 h-5 group-hover:text-yellow-300 transition-colors" />
                            {language === 'es' ? 'Analizar y Estructurar Libro' : 'Analyze & Structure Book'}
                        </span>
                    )}
                </button>
            </div>

            {/* Preview / Results Section */}
            <div className="bg-white border border-slate-200 rounded-xl p-8 flex flex-col h-full shadow-sm">
                {book.chapters && book.chapters.length > 0 ? (
                    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="mb-6 pb-6 border-b border-slate-100">
                            <h3 className="text-xl font-serif text-slate-900 mb-2">{book.title}</h3>
                            <p className="text-slate-500 text-sm line-clamp-2">{book.description}</p>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                                {book.chapters.map((chapter, idx) => {
                                    const label = getChapterLabel(idx, chapter.title);
                                    return (
                                        <motion.div
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            key={chapter.id}
                                            className="bg-slate-50 p-4 rounded-lg border border-slate-100 hover:border-indigo-500/30 transition-colors cursor-default group"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                                                    {label}
                                                </span>
                                            </div>
                                            <h4 className="text-lg font-medium text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">{chapter.title}</h4>
                                            <p className="text-slate-600 text-sm opacity-80">{chapter.summary}</p>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-100">
                            <button
                                onClick={onNext}
                                className="w-full py-4 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-all flex items-center justify-center gap-2 group border border-slate-200 hover:border-slate-300"
                            >
                                Proceed to Visual Studio
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-center max-w-xs">
                            AI Architect is waiting for input.<br />Paste your manuscript to begin.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
