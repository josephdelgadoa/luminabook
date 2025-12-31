import React, { useState } from 'react';
import type { EBook } from '@/types';
import { generateImage } from '@/services/ai-service';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Maximize2, Minimize2,
    Wand2, Layers, Type,
    RefreshCw, AlertCircle, CheckCircle2, Image as ImageIcon,
    BookOpen
} from 'lucide-react';

interface VisualStudioProps {
    book: Partial<EBook>;
    setBook: (book: Partial<EBook>) => void;
}

export const VisualStudio: React.FC<VisualStudioProps> = ({ book, setBook }) => {
    // State
    const [selectedSectionId, setSelectedSectionId] = useState<string | 'cover'>('cover');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [promptText, setPromptText] = useState("");
    const [showUI, setShowUI] = useState(true);

    // Derived Selectors
    const isCoverSelected = selectedSectionId === 'cover';
    const selectedChapterIndex = book.chapters?.findIndex(c => c.id === selectedSectionId) ?? -1;
    const selectedChapter = selectedChapterIndex >= 0 ? book.chapters?.[selectedChapterIndex] : null;

    // Helper to update prompt when selection changes
    React.useEffect(() => {
        if (isCoverSelected) {
            setPromptText(book.coverImagePrompt || `Epic cinematic book cover for "${book.title}". Highly detailed, 8k resolution.`);
        } else if (selectedChapter) {
            setPromptText(selectedChapter.imagePrompt || `Wide cinematic shot for ${selectedChapter.title}. Panoramic, detailed.`);
        }
    }, [selectedSectionId, book.coverImagePrompt, selectedChapter?.imagePrompt]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);

        try {
            // Force 16:3 aspect ratio logic for prompts if needed, or just let Flux handle it via style
            const styleSuffix = isCoverSelected ? "" : ", cinematic panoramic, wide aspect ratio";
            const finalPrompt = promptText + (promptText.includes('aspect') ? '' : styleSuffix);

            const url = await generateImage(finalPrompt);

            if (isCoverSelected) {
                setBook({ ...book, coverImageUrl: url, coverImagePrompt: promptText });
            } else if (selectedChapter) {
                const newChapters = [...(book.chapters || [])];
                newChapters[selectedChapterIndex] = {
                    ...selectedChapter,
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

    // Rendering Helpers
    const activeImage = isCoverSelected ? book.coverImageUrl : selectedChapter?.imageUrl;

    return (
        <div className="flex h-full bg-[#0a0a0a] text-white overflow-hidden rounded-2xl border border-white/10 shadow-2xl relative">

            {/* LEFT: THE SCROLLABLE CANVAS (Full Book View) */}
            <div className={`relative flex-1 h-full overflow-y-auto custom-scrollbar transition-all duration-500 ease-in-out ${showUI ? 'lg:mr-[400px]' : ''}`}>
                <div className="max-w-4xl mx-auto min-h-full pb-32">

                    {/* --- 1. COVER SECTION --- */}
                    <div
                        onClick={() => setSelectedSectionId('cover')}
                        className={`relative group cursor-pointer transition-all duration-300 ${isCoverSelected ? 'ring-2 ring-amber-500' : 'hover:ring-1 hover:ring-white/20'}`}
                    >
                        {/* Full Height Cover Wrapper */}
                        <div className="relative w-full aspect-[2/3] lg:aspect-[16/9] lg:h-[80vh] overflow-hidden">
                            {book.coverImageUrl ? (
                                <img src={book.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-white/20">
                                    <ImageIcon size={64} strokeWidth={1} />
                                    <p className="mt-4 text-xs tracking-widest uppercase">Cover Placeholder</p>
                                </div>
                            )}

                            {/* Cinematic Overlay */}
                            <div className="absolute inset-0 flex flex-col justify-end p-12 bg-gradient-to-t from-black via-black/40 to-transparent">
                                <h1 className="font-serif text-5xl lg:text-7xl font-bold text-center text-white drop-shadow-2xl mb-8">
                                    {book.title || "Untitled Book"}
                                </h1>
                                <div className="flex flex-col items-center">
                                    <div className="h-px w-32 bg-amber-500/50 mb-4 blur-[1px]" />
                                    <p className="font-sans font-light text-amber-100/90 text-lg tracking-[0.4em] uppercase drop-shadow-md">
                                        {book.author || "Joseph Delgado"}
                                    </p>
                                    <div className="h-px w-32 bg-amber-500/50 mt-4 blur-[1px]" />
                                </div>
                            </div>
                        </div>

                        {/* Selection Indicator */}
                        {isCoverSelected && (
                            <div className="absolute top-4 right-4 bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2 shadow-lg z-10">
                                <Wand2 size={12} /> EDITING COVER
                            </div>
                        )}
                    </div>

                    {/* --- 2. BOOK CONTENT (Chapters) --- */}
                    <div className="px-8 lg:px-16 py-16 space-y-24 bg-neutral-900/50">
                        {book.chapters?.map((chapter, index) => {
                            const isSelected = selectedSectionId === chapter.id;

                            // 16:3 Aspect Ratio for Banner
                            // Tailwind doesn't have 16/3 built-in, using custom style or approximate
                            return (
                                <div
                                    key={chapter.id || index}
                                    id={`chapter-${chapter.id}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedSectionId(chapter.id || 'cover');
                                    }}
                                    className={`relative rounded-xl overflow-hidden transition-all duration-300 border ${isSelected ? 'border-amber-500 shadow-2xl shadow-amber-900/20' : 'border-white/5 hover:border-white/20'}`}
                                >
                                    {/* Chapter Banner Image (16:3) */}
                                    <div className="relative w-full aspect-[16/5] bg-slate-800 overflow-hidden group">
                                        {chapter.imageUrl ? (
                                            <img src={chapter.imageUrl} alt={chapter.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white/10">
                                                <ImageIcon size={32} />
                                            </div>
                                        )}

                                        {/* Chapter Title Overlay */}
                                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
                                            <h2 className="font-serif text-3xl text-white font-bold">{chapter.title}</h2>
                                        </div>

                                        {isSelected && (
                                            <div className="absolute top-4 right-4 bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2 shadow-lg">
                                                <Wand2 size={12} /> EDITING
                                            </div>
                                        )}
                                    </div>

                                    {/* Full Text Content */}
                                    <div className="p-8 lg:p-12 bg-black/40 text-gray-300 leading-relaxed font-serif text-lg space-y-6">
                                        {chapter.content?.split('\n').map((para, i) => (
                                            para.trim() && <p key={i}>{para.trim()}</p>
                                        ))}
                                        {!chapter.content && <p className="italic opacity-30">No content available for this chapter.</p>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* End of Book Marker */}
                    <div className="flex justify-center pb-16 opacity-30">
                        <BookOpen size={24} />
                    </div>
                </div>

                {/* UI Toggle */}
                <button
                    onClick={() => setShowUI(!showUI)}
                    className="fixed top-8 right-8 z-30 p-3 rounded-full bg-black/50 hover:bg-white/10 backdrop-blur-md border border-white/10 transition-all"
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
                        className="absolute right-0 top-0 bottom-0 w-full lg:w-[400px] bg-black/80 backdrop-blur-xl border-l border-white/10 flex flex-col z-20 shadow-2xl"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
                            <div>
                                <h2 className="text-sm font-bold uppercase tracking-widest text-white/90">Art Director</h2>
                                <p className="text-[10px] text-white/50 mt-1">
                                    {isCoverSelected ? 'Editing: FRONT COVER' : 'Editing: CHAPTER SCENE'}
                                </p>
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
                                    placeholder={isCoverSelected ? "Describe the book cover..." : "Describe the chapter scene..."}
                                />
                                <div className="flex flex-wrap gap-2">
                                    {['Cinematic', 'Noir', 'Wide Shot', 'Detail'].map(style => (
                                        <button
                                            key={style}
                                            onClick={() => setPromptText(p => p + `, ${style}`)}
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
                                        <span className="block text-white/30">Ratio</span>
                                        {isCoverSelected ? '2:3 (Portrait)' : '16:5 (Banner)'}
                                    </div>
                                    <div>
                                        <span className="block text-white/30">Engine</span>
                                        Pollinations (Flux)
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
