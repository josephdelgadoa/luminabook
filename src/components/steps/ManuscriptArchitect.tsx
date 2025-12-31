import React, { useState } from 'react';
import type { EBook } from '@/types';
import { motion } from 'framer-motion';
import { analyzeManuscript } from '@/services/ai-service';
import { Sparkles, ArrowRight, FileText, Terminal } from 'lucide-react';

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
        const isIntro = (t: string) => /intro|prologue|prólogo|preface|prefacio/i.test(t);

        if (isIntro(title)) return null;

        // Count how many non-intro chapters exist up to this point
        const previousChapters = book.chapters?.slice(0, index + 1).filter(c => !isIntro(c.title));
        const chapterNum = previousChapters?.length || (index + 1);

        const labelStr = language === 'es' ? 'Capítulo' : 'Chapter';
        const fullLabel = `${labelStr} ${chapterNum}`;

        // Deduplication: If title already contains "Chapter X" or "Capítulo X", return null
        // Normalize checking by removing punctuation and case
        const normalizedTitle = title.toLowerCase().replace(/[:.]/g, '');
        const normalizedLabel = fullLabel.toLowerCase();

        if (normalizedTitle.includes(normalizedLabel) ||
            normalizedTitle.includes(`chapter ${chapterNum}`) ||
            normalizedTitle.includes(`capítulo ${chapterNum}`)) {
            return null;
        }

        return fullLabel;
    };



    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 h-full min-h-[800px] overflow-hidden rounded-3xl shadow-2xl">

            {/* LEFT PANEL: The AI Terminal (Dark Mode) */}
            <div className="bg-slate-950 p-8 lg:p-12 flex flex-col border-r border-slate-800 relative z-10">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <Terminal className="w-64 h-64 text-white" />
                </div>

                <div className="flex items-center justify-between mb-8 relative z-20">
                    <div>
                        <h2 className="text-3xl font-sans font-bold text-white tracking-tight flex items-center gap-3">
                            <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
                            Manuscript Input
                        </h2>
                        <p className="text-slate-400 mt-2 text-sm">Paste your raw text to begin architectural structuring.</p>
                    </div>
                </div>

                <div className="bg-slate-900/50 p-1 rounded-xl flex w-fit mb-6 border border-slate-800">
                    <button
                        onClick={() => setLanguage('en')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${language === 'en' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-white'}`}
                    >
                        English Input
                    </button>
                    <button
                        onClick={() => setLanguage('es')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${language === 'es' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-white'}`}
                    >
                        Español Input
                    </button>
                </div>

                <div className="flex-1 relative group">
                    <div className="absolute inset-0 bg-indigo-500/5 rounded-xl blur-xl group-hover:bg-indigo-500/10 transition-colors duration-500"></div>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={language === 'es' ? "Pegue su manuscrito aquí..." : "// Paste raw text data or upload document..."}
                        className="relative z-10 w-full h-full bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 resize-none font-mono text-sm leading-relaxed shadow-inner"
                        spellCheck={false}
                    />

                    <label className="absolute bottom-6 right-6 z-20 cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors flex items-center gap-2 border border-slate-700 shadow-lg">
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
                        <FileText className="w-3 h-3" />
                        LOAD_FILE
                    </label>
                </div>

                <div className="pt-6">
                    <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || !text.trim()}
                        className="w-full py-5 bg-white text-slate-950 hover:bg-indigo-50 disabled:bg-slate-800 disabled:text-slate-600 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                    >
                        {isAnalyzing ? (
                            <>
                                <Sparkles className="w-5 h-5 animate-spin text-indigo-600" />
                                <span>PROCESSING_DATA...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5 text-indigo-600" />
                                <span>INITIALIZE ARCHITECT</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* RIGHT PANEL: The Paper Preview (White Mode) */}
            <div className="bg-slate-100 p-8 lg:p-12 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pointer-events-none"></div>

                {book.chapters && book.chapters.length > 0 ? (
                    <div className="w-full max-w-xl h-full animate-in fade-in slide-in-from-bottom-8 duration-700 flex flex-col">

                        {/* Paper Sheet */}
                        <div className="bg-white flex-1 rounded-sm shadow-2xl p-8 md:p-12 overflow-y-auto custom-scrollbar border border-slate-200/50">
                            <div className="mb-12 text-center border-b-2 border-slate-950 pb-8">
                                {book.coverImageUrl && (
                                    <div className="mb-8 w-32 mx-auto rounded overflow-hidden shadow-lg transform rotate-[-2deg] border-2 border-slate-900/10">
                                        <img src={book.coverImageUrl} alt="Cover" className="w-full h-auto object-cover" />
                                    </div>
                                )}
                                <h3 className="text-4xl font-serif font-bold text-slate-900 mb-4 leading-tight">{book.title}</h3>
                                <p className="text-lg font-serif italic text-slate-500">{book.author || "Author Info"}</p>
                                <p className="text-sm font-sans text-slate-400 mt-4 max-w-sm mx-auto">{book.description}</p>
                            </div>

                            <div className="space-y-8">
                                {book.chapters.map((chapter, idx) => {
                                    const label = getChapterLabel(idx, chapter.title);
                                    return (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            key={chapter.id}
                                            className="group cursor-default"
                                        >
                                            <div className="flex items-baseline gap-4 mb-2">
                                                {label && (
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest min-w-[80px]">
                                                        {label}
                                                    </span>
                                                )}
                                                <h4 className="text-xl font-serif font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">
                                                    {chapter.title}
                                                </h4>
                                            </div>
                                            <p className="pl-[96px] text-slate-600 font-serif leading-relaxed text-sm opacity-80 border-l border-transparent group-hover:border-indigo-200 group-hover:pl-4 transition-all">
                                                {chapter.summary}
                                            </p>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mt-8">
                            <button
                                onClick={onNext}
                                className="w-full py-4 bg-slate-900 text-white hover:bg-indigo-600 rounded-xl font-medium transition-all flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl shadow-slate-900/20 group"
                            >
                                <span>Approve Structure & Continue</span>
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center opacity-40 max-w-sm">
                        <div className="w-32 h-48 border-2 border-dashed border-slate-400 mx-auto mb-6 rounded flex items-center justify-center bg-white shadow-sm">
                            <span className="text-6xl font-serif text-slate-200">Aa</span>
                        </div>
                        <h3 className="text-2xl font-serif font-bold text-slate-800 mb-2">Paper Preview</h3>
                        <p className="font-serif text-slate-600 italic">
                            waiting for manuscript input...
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
