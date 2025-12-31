import React, { useState, useEffect } from 'react';
import type { EBook } from '@/types';
import { generateImage } from '@/services/ai-service';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Maximize2, Minimize2, ChevronLeft, ChevronRight,
    Wand2, Layers, Type,
    RefreshCw, AlertCircle, CheckCircle2, Image as ImageIcon
} from 'lucide-react';

interface VisualStudioProps {
    book: Partial<EBook>;
    setBook: (book: Partial<EBook>) => void;
}

// "Art Director" Layout -> Dedicated Canvas + Control Panel
export const VisualStudio: React.FC<VisualStudioProps> = ({ book, setBook }) => {
    // State
    const [currentPage, setCurrentPage] = useState(0); // 0 = Cover, 1...N = Chapters
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [promptText, setPromptText] = useState("");
    const [showUI, setShowUI] = useState(true);

    // Derived
    const totalChapters = book.chapters?.length || 0;
    const totalPages = totalChapters + 1; // Cover + Chapters

    // Determine context
    const isCover = currentPage === 0;
    const currentChapter = !isCover ? book.chapters?.[currentPage - 1] : null;

    // Sync prompt text when navigating
    useEffect(() => {
        if (isCover) {
            setPromptText(book.coverImagePrompt || `Epic cinematic book cover for "${book.title}". Highly detailed, 8k resolution.`);
        } else if (currentChapter) {
            setPromptText(currentChapter.imagePrompt || `Atmospheric illustration for ${currentChapter.title}. Photorealistic, dramatic lighting.`);
        }
    }, [currentPage, book.coverImagePrompt, currentChapter?.imagePrompt]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);

        try {
            const url = await generateImage(promptText);

            if (isCover) {
                setBook({ ...book, coverImageUrl: url, coverImagePrompt: promptText });
            } else if (currentChapter) {
                const newChapters = [...(book.chapters || [])];
                newChapters[currentPage - 1] = {
                    ...currentChapter,
                    imageUrl: url,
                    imagePrompt: promptText
                };
                setBook({ ...book, chapters: newChapters });
            }
        } catch (e: any) {
            setError(e.message || "Generation failed. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleNext = () => setCurrentPage(p => Math.min(p + 1, totalPages - 1));
    const handlePrev = () => setCurrentPage(p => Math.max(p - 1, 0));

    // Current Image to Display
    const activeImage = isCover ? book.coverImageUrl : currentChapter?.imageUrl;
    const activeTitle = isCover ? book.title : currentChapter?.title;

    return (
        <div className="flex h-full bg-[#0a0a0a] text-white overflow-hidden rounded-2xl border border-white/10 shadow-2xl relative">

            {/* BACKGROUND BLUR (Ambient) */}
            {activeImage && (
                <div
                    className="absolute inset-0 opacity-20 blur-3xl saturate-200 pointer-events-none transition-all duration-1000"
                    style={{ backgroundImage: `url(${activeImage})`, backgroundSize: 'cover' }}
                />
            )}

            {/* LEFT: THE CANVAS (Preview) */}
            <div className={`relative flex-1 flex flex-col items-center justify-center p-8 transition-all duration-500 ease-in-out ${showUI ? 'lg:mr-[400px]' : ''}`}>

                {/* Book Representation */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={currentPage}
                    className="relative w-full max-w-lg aspect-[1/1.5] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] rounded-lg overflow-hidden border border-white/5 bg-slate-900 group"
                >
                    {activeImage ? (
                        <img
                            src={activeImage}
                            alt="Book Asset"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-white/20">
                            <ImageIcon size={64} strokeWidth={1} />
                            <p className="mt-4 font-light tracking-widest text-xs uppercase">No Asset Generated</p>
                        </div>
                    )}

                    {/* Overlay Text Preview (Cinematic "Surprise" Layout) */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none p-6 lg:p-12">

                        {/* Top Gradient & Title */}
                        <div className="w-full bg-gradient-to-b from-black/80 via-black/40 to-transparent pt-8 pb-12 px-4 rounded-t-lg">
                            <h1 className={`font-serif font-bold text-center drop-shadow-2xl text-white ${isCover ? 'text-4xl lg:text-5xl tracking-tight leading-tight' : 'text-2xl'}`}>
                                {activeTitle}
                            </h1>

                            {/* Author Name - SURPRISE: Elegant, Gold-tinted, Spaced Out */}
                            {isCover && (
                                <div className="mt-4 flex flex-col items-center">
                                    <div className="h-px w-24 bg-amber-500/50 mb-3 blur-[1px]" />
                                    <p className="text-center font-sans font-light text-amber-100/90 text-sm lg:text-base tracking-[0.3em] uppercase drop-shadow-md">
                                        {book.author || "Joseph Delgado"}
                                    </p>
                                    <div className="h-px w-24 bg-amber-500/50 mt-3 blur-[1px]" />
                                </div>
                            )}
                        </div>

                        {/* Bottom Gradient for Contrast if Chapter */}
                        {!isCover && currentChapter && (
                            <div className="bg-gradient-to-t from-black/90 to-transparent p-6 rounded-b-lg">
                                <p className="text-white/80 text-center text-sm italic">{currentChapter.title}</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Navigation Floating Bar */}
                <div className="absolute bottom-8 flex items-center gap-4 bg-black/50 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
                    <button onClick={handlePrev} disabled={currentPage === 0} className="hover:text-amber-400 disabled:opacity-30 transition-colors">
                        <ChevronLeft />
                    </button>
                    <span className="text-xs font-mono tracking-widest w-32 text-center text-white/70">
                        {isCover ? "FRONT COVER" : `CHAPTER ${currentPage} / ${totalChapters}`}
                    </span>
                    <button onClick={handleNext} disabled={currentPage === totalPages - 1} className="hover:text-amber-400 disabled:opacity-30 transition-colors">
                        <ChevronRight />
                    </button>
                </div>

                {/* UI Toggle */}
                <button
                    onClick={() => setShowUI(!showUI)}
                    className="absolute top-8 right-8 p-3 rounded-full bg-black/50 hover:bg-white/10 backdrop-blur-md border border-white/10 transition-all"
                >
                    {showUI ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
                </button>
            </div>

            {/* RIGHT: ART DIRECTOR PANEL (Controls) */}
            <AnimatePresence>
                {showUI && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="absolute right-0 top-0 bottom-0 w-full lg:w-[400px] bg-black/80 backdrop-blur-xl border-l border-white/10 flex flex-col z-20"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-bold uppercase tracking-widest text-white/90">Art Director</h2>
                                <p className="text-[10px] text-white/50 mt-1">Pollinations (Flux) Engine</p>
                            </div>
                            <Wand2 className="text-amber-400 w-5 h-5" />
                        </div>

                        {/* Controls */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                            {/* Prompt Input */}
                            <div className="space-y-3">
                                <label className="text-xs font-medium text-white/60 flex items-center gap-2">
                                    <Type size={14} />
                                    VISUAL PROMPT
                                </label>
                                <textarea
                                    value={promptText}
                                    onChange={(e) => setPromptText(e.target.value)}
                                    className="w-full h-32 bg-white/5 border border-white/10 rounded-lg p-4 text-sm leading-relaxed text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 resize-none transition-all"
                                    placeholder="Describe the scene in detail..."
                                />
                                <div className="flex gap-2">
                                    {['Cinematic', 'Minimalist', 'Noir', 'Oil Painting'].map(style => (
                                        <button
                                            key={style}
                                            onClick={() => setPromptText(p => p + `, ${style} style`)}
                                            className="text-[10px] px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors"
                                        >
                                            +{style}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Status Messages */}
                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                                    <AlertCircle className="text-red-400 shrink-0 w-5 h-5" />
                                    <p className="text-xs text-red-200 leading-snug">{error}</p>
                                </div>
                            )}

                            {/* Generate Button */}
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !promptText.trim()}
                                className={`
                                    w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold tracking-wide uppercase text-sm transition-all
                                    ${isGenerating
                                        ? 'bg-amber-500/20 text-amber-500 cursor-wait'
                                        : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40'
                                    }
                                `}
                            >
                                {isGenerating ? (
                                    <>
                                        <RefreshCw className="animate-spin w-4 h-4" /> Rendering...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-4 h-4" />
                                        {activeImage ? 'Regenerate Asset' : 'Generate Asset'}
                                    </>
                                )}
                            </button>

                            {/* Info Block */}
                            <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-lg space-y-2">
                                <div className="flex items-center gap-2 text-blue-300 mb-1">
                                    <Layers size={14} />
                                    <span className="text-xs font-bold uppercase">Asset Specs</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-[10px] text-white/50">
                                    <div>
                                        <span className="block text-white/30">Model</span>
                                        Flux 1.1 Pro
                                    </div>
                                    <div>
                                        <span className="block text-white/30">Resolution</span>
                                        1024x1536
                                    </div>
                                    <div>
                                        <span className="block text-white/30">Aspect</span>
                                        2:3 (Portrait)
                                    </div>
                                    <div>
                                        <span className="block text-white/30">Format</span>
                                        PNG
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/10 flex justify-between items-center text-[10px] text-white/30 uppercase tracking-widest">
                            <span>LuminaBook Studio v2.0</span>
                            {activeImage && <span className="flex items-center gap-1 text-green-400"><CheckCircle2 size={12} /> Saved</span>}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
