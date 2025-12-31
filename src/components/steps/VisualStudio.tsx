import React, { useState } from 'react';
import type { EBook, BookTheme } from '@/types';
import { generateImage } from '@/services/ai-service';
import { motion, AnimatePresence } from 'framer-motion';
import { Type, Image as ImageIcon, Sparkles, RefreshCw, Smartphone, Monitor, ChevronLeft, ChevronRight, LayoutTemplate, AlertCircle } from 'lucide-react';

interface VisualStudioProps {
    book: Partial<EBook>;
    setBook: (book: Partial<EBook>) => void;
}

const THEMES: BookTheme[] = [
    {
        id: 'modern',
        name: 'Modern Slate',
        fontHeading: '"Playfair Display", serif',
        fontBody: '"Inter", sans-serif',
        primaryColor: '#4f46e6',
        backgroundColor: '#f8fafc',
        textColor: '#0f172a'
    },
    {
        id: 'minimalist',
        name: 'Swiss Minimal',
        fontHeading: '"Inter", sans-serif',
        fontBody: '"Inter", sans-serif',
        primaryColor: '#000000',
        backgroundColor: '#ffffff',
        textColor: '#1a1a1a'
    },
    {
        id: 'bold',
        name: 'Editorial Bold',
        fontHeading: '"Merriweather", serif',
        fontBody: '"Merriweather", serif',
        primaryColor: '#be123c',
        backgroundColor: '#fff1f2',
        textColor: '#4c0519'
    }
];

// Skeleton Component
const ImageSkeleton = () => (
    <div className="w-full h-full bg-slate-800 animate-pulse flex items-center justify-center rounded-lg border border-slate-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/50 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
        <Sparkles className="w-6 h-6 text-slate-600 animate-pulse" />
    </div>
);

export const VisualStudio: React.FC<VisualStudioProps> = ({ book, setBook }) => {
    const [activeTab, setActiveTab] = useState<'theme' | 'images'>('theme');
    const [isGenerating, setIsGenerating] = useState<string | null>(null); // 'cover', 'back', or chapterId
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
    const [currentPage, setCurrentPage] = useState(0); // 0 = Cover, 1...N = Chapters, N+1 = Back Cover

    const totalPages = (book.chapters?.length || 0) + 2; // Cover + Chapters + Back

    const handleThemeChange = (theme: BookTheme) => {
        setBook({ ...book, theme });
    };

    const handleGenerateImage = async (target: 'cover' | 'back' | string, type: 'cover' | 'back' | 'chapter', customPrompt?: string) => {
        setIsGenerating(target);
        setErrorMsg(null);

        try {
            let prompt = customPrompt || "";
            let generatedUrl = "";

            if (type === 'cover') {
                prompt = prompt || book.coverImagePrompt || `Book cover for "${book.title}", ${book.theme?.name} style. Minimalist, premium.`;
                generatedUrl = await generateImage(prompt, 800, 1200);
                setBook({ ...book, coverImageUrl: generatedUrl, coverImagePrompt: prompt });
            }
            else if (type === 'back') {
                prompt = prompt || book.backCoverImagePrompt || `Back cover for "${book.title}", ${book.theme?.name} style.`;
                generatedUrl = await generateImage(prompt, 800, 1200);
                setBook({ ...book, backCoverImageUrl: generatedUrl, backCoverImagePrompt: prompt });
            }
            else {
                // Chapter Generation
                const chapter = book.chapters?.find(c => c.id === target);
                if (!chapter) throw new Error("Chapter not found");

                prompt = prompt || chapter.imagePrompt || `Illustration for ${chapter.title}`;
                generatedUrl = await generateImage(prompt, 1600, 800); // Cinematic 2:1 Ratio

                const updatedChapters = book.chapters?.map(c =>
                    c.id === target ? { ...c, imageUrl: generatedUrl, imagePrompt: prompt } : c
                );
                setBook({ ...book, chapters: updatedChapters });
            }

        } catch (e: any) {
            console.error("Visual Studio Generation Error:", e);
            setErrorMsg(`Generation failed: ${e.message || "Unknown error"}`);

            // Clear error after 5 seconds automatically
            setTimeout(() => setErrorMsg(null), 5000);
        } finally {
            setIsGenerating(null);
        }
    };

    // Safe access to theme properties with fallbacks
    const currentTheme = book.theme || THEMES[0];

    const nextPage = () => setCurrentPage(p => Math.min(p + 1, totalPages - 1));
    const prevPage = () => setCurrentPage(p => Math.max(p - 1, 0));

    // Render content based on currentPage
    const renderPageContent = () => {
        if (currentPage === 0) {
            // FRONT COVER - PROFESSIONAL REDESIGN
            return (
                <div className="h-full flex flex-col relative overflow-hidden">
                    {book.coverImageUrl && (
                        <div className="absolute inset-0 z-0">
                            {/* Main Image */}
                            <img src={book.coverImageUrl} className="w-full h-full object-cover" alt="Cover" />

                            {/* Professional Gradient Overlay Strategy */}
                            {/* Top Gradient: Darkens top 40% for Title Readability */}
                            <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-black/90 via-black/40 to-transparent" />

                            {/* Bottom Gradient: Darkens bottom 30% for Author Name */}
                            <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                        </div>
                    )}

                    {/* Content Layer with Distributed Layout */}
                    <div className="flex-1 flex flex-col justify-between p-12 z-10 relative h-full">

                        {/* TITLE SECTION (Top 25-40%) */}
                        <div className="mt-4 md:mt-8 text-center">
                            <h1
                                className="text-4xl md:text-6xl font-bold leading-tight"
                                style={{
                                    fontFamily: currentTheme.fontHeading,
                                    color: book.coverImageUrl ? '#FFFFFF' : currentTheme.primaryColor,
                                    // Soft Drop Shadow (No Stroke/Border)
                                    textShadow: book.coverImageUrl ? '0 4px 30px rgba(0,0,0,0.6)' : 'none'
                                }}
                            >
                                {book.title || "Untitled Book"}
                            </h1>
                            {/* Optional Tagline Placeholder */}
                            <p className="mt-4 text-white/80 text-sm md:text-base font-light italic tracking-wider drop-shadow-md">
                                {book.description ? book.description.substring(0, 50) + "..." : "A LuminaBook Original"}
                            </p>
                        </div>

                        {/* AUTHOR SECTION (Bottom) */}
                        <div className="mb-4 md:mb-8 text-center">
                            <div className="w-12 h-1 bg-white/60 mx-auto mb-6 shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                            <p
                                className="text-xl md:text-2xl font-medium tracking-[0.2em] uppercase"
                                style={{
                                    fontFamily: currentTheme.fontBody,
                                    // Use off-white/gold hint for author
                                    color: book.coverImageUrl ? '#f1f5f9' : currentTheme.textColor,
                                    textShadow: book.coverImageUrl ? '0 2px 20px rgba(0,0,0,0.8)' : 'none'
                                }}
                            >
                                {book.author || "Joseph Delgado"}
                            </p>
                        </div>
                    </div>
                </div>
            );
        } else if (currentPage === totalPages - 1) {
            // BACK COVER
            return (
                <div className="h-full flex flex-col relative overflow-hidden p-12">
                    {book.backCoverImageUrl && (
                        <div className="absolute inset-0 z-0">
                            <img src={book.backCoverImageUrl} className="w-full h-full object-cover opacity-30" alt="Back Cover" />
                        </div>
                    )}
                    <div className="flex-1 flex flex-col items-center justify-center z-10 relative">
                        <div className="max-w-md mx-auto text-center space-y-6">
                            <h3 className="text-xl font-serif font-bold opacity-90" style={{ fontFamily: currentTheme.fontHeading }}>About the Book</h3>
                            <p className="leading-relaxed opacity-80 text-sm md:text-base">
                                {book.description || "No description available."}
                            </p>
                            <div className="pt-8 opacity-60">
                                <LayoutTemplate className="w-8 h-8 mx-auto mb-2" />
                                <span className="text-xs uppercase tracking-widest">LuminaBook Press</span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        } else {
            // CHAPTER PAGE
            const chapterIndex = currentPage - 1;
            const chapter = book.chapters?.[chapterIndex];

            if (!chapter) return <div>Chapter not found</div>;

            return (
                <div className="h-full flex flex-col relative overflow-hidden bg-white">
                    <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
                        <div className="max-w-xl mx-auto">
                            <div className="text-center mb-12">
                                {chapter.imageUrl ? (
                                    <div className="mb-8 rounded-lg overflow-hidden shadow-lg border border-slate-100 relative group">
                                        <img src={chapter.imageUrl} alt={chapter.title} className="w-full h-auto object-cover max-h-[300px]" />

                                        {/* Overlay Button */}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                onClick={() => handleGenerateImage(chapter.id, 'chapter')}
                                                className="bg-white/90 hover:bg-white text-slate-900 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-xl flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-all"
                                            >
                                                <RefreshCw className="w-3 h-3" /> Regenerate
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mb-8 rounded-lg overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50 py-12 flex flex-col items-center justify-center group h-[300px]">
                                        <div className="text-slate-400 mb-4"><ImageIcon className="w-12 h-12 opacity-50" /></div>
                                        <button
                                            onClick={() => handleGenerateImage(chapter.id, 'chapter')}
                                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-full text-sm font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 transform transition-all hover:scale-105"
                                        >
                                            <Sparkles className="w-4 h-4" /> Generate Illustration
                                        </button>
                                        <p className="text-xs text-slate-400 mt-4 max-w-sm px-8 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            "{chapter.imagePrompt || "Generate an artistic illustration for this chapter..."}"
                                        </p>
                                    </div>
                                )}

                                <span className="text-xs font-bold uppercase tracking-widest opacity-40 mb-2 block">
                                    {(() => {
                                        if (/intro|prologue|prólogo|preface|prefacio/i.test(chapter.title)) {
                                            return "";
                                        }
                                        const prevChapters = book.chapters?.slice(0, chapterIndex + 1).filter(c => !/intro|prologue|prólogo|preface|prefacio/i.test(c.title));
                                        const num = prevChapters?.length || (chapterIndex + 1);
                                        const label = `Chapter ${num}`;
                                        const spanishLabel = `Capítulo ${num}`;

                                        // Avoid duplication if title already contains the label
                                        if (chapter.title.toLowerCase().includes(label.toLowerCase()) ||
                                            chapter.title.toLowerCase().includes(spanishLabel.toLowerCase())) {
                                            return "";
                                        }
                                        return label;
                                    })()}
                                </span>
                                <h2
                                    className="text-3xl md:text-4xl font-bold mb-8"
                                    style={{ fontFamily: currentTheme.fontHeading, color: currentTheme.primaryColor }}
                                >
                                    {chapter.title}
                                </h2>
                            </div>

                            <div
                                className="prose prose-slate prose-lg max-w-none text-justify leading-loose"
                                style={{ fontFamily: currentTheme.fontBody }}
                            >
                                {chapter.content.split(/\n+/).map((para, i) => (
                                    para.trim() && <p key={i} className="mb-6 indent-8 opacity-90">{para}</p>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Page Footer */}
                    <div className="h-12 border-t border-slate-100 flex items-center justify-between px-8 text-[10px] text-slate-400 uppercase tracking-widest">
                        <span>{book.title}</span>
                        <span>Page {currentPage}</span>
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full min-h-[700px]">

            {/* LEFT: Tools Panel */}
            <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 flex-1 shadow-2xl relative overflow-hidden">

                    {/* Error Toast */}
                    {errorMsg && (
                        <div className="absolute top-0 left-0 right-0 bg-red-500 text-white p-3 text-xs font-bold flex items-center gap-2 z-50 animate-slide-down">
                            <AlertCircle className="w-4 h-4" />
                            {errorMsg}
                        </div>
                    )}

                    <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-700/50">
                        <button
                            onClick={() => setActiveTab('theme')}
                            className={`flex items-center gap-2 pb-2 -mb-4 border-b-2 transition-colors ${activeTab === 'theme' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                        >
                            <Type className="w-4 h-4" /> Design
                        </button>
                        <button
                            onClick={() => setActiveTab('images')}
                            className={`flex items-center gap-2 pb-2 -mb-4 border-b-2 transition-colors ${activeTab === 'images' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                        >
                            <ImageIcon className="w-4 h-4" /> Gallery
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {activeTab === 'theme' ? (
                            <div className="space-y-8">
                                {/* Theme Selection */}
                                <div>
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Core Aesthetic</h3>
                                    <div className="space-y-3">
                                        {THEMES.map(theme => (
                                            <button
                                                key={theme.id}
                                                onClick={() => handleThemeChange(theme)}
                                                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 group ${currentTheme.id === theme.id ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500' : 'bg-slate-900 border-slate-700 hover:border-slate-600 hover:bg-slate-800'}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full shadow-lg border border-white/10" style={{ backgroundColor: theme.primaryColor }} />
                                                    <div className="text-left">
                                                        <div className="text-white font-medium text-sm group-hover:text-indigo-300 transition-colors">{theme.name}</div>
                                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                                                            {theme.id === 'modern' ? 'Serif & Clean' : theme.id === 'minimalist' ? 'Swiss Grid' : 'Bold & Loud'}
                                                        </div>
                                                    </div>
                                                </div>
                                                {currentTheme.id === theme.id && <div className="text-indigo-400 bg-indigo-500/10 p-1.5 rounded-lg"><Sparkles className="w-4 h-4" /></div>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Asset Generation</h3>

                                {/* Front Cover */}
                                <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium text-white">Front Cover</span>
                                        {book.coverImageUrl && !isGenerating && <span className="text-xs text-green-400 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Ready</span>}
                                    </div>

                                    {/* Editable Prompt */}
                                    <textarea
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 mb-3 focus:ring-1 focus:ring-indigo-500 outline-none resize-none custom-scrollbar"
                                        rows={3}
                                        value={book.coverImagePrompt || ""}
                                        placeholder="Enter prompt for cover image..."
                                        onChange={(e) => setBook({ ...book, coverImagePrompt: e.target.value })}
                                    />

                                    {isGenerating === 'cover' ? (
                                        <div className="h-48 mb-3 rounded-lg overflow-hidden">
                                            <ImageSkeleton />
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleGenerateImage('cover', 'cover')}
                                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold text-white uppercase tracking-wider transition-colors flex items-center justify-center gap-2 group"
                                        >
                                            <Sparkles className="w-3 h-3 group-hover:text-yellow-300" />
                                            {book.coverImageUrl ? 'Regenerate Cover' : 'Generate Cover'}
                                        </button>
                                    )}
                                </div>

                                {/* Back Cover */}
                                <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium text-white">Back Cover</span>
                                        {book.backCoverImageUrl && !isGenerating && <span className="text-xs text-green-400 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Ready</span>}
                                    </div>

                                    {/* Editable Prompt */}
                                    <textarea
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 mb-3 focus:ring-1 focus:ring-indigo-500 outline-none resize-none custom-scrollbar"
                                        rows={3}
                                        value={book.backCoverImagePrompt || ""}
                                        placeholder="Enter prompt for back cover..."
                                        onChange={(e) => setBook({ ...book, backCoverImagePrompt: e.target.value })}
                                    />

                                    {isGenerating === 'back' ? (
                                        <div className="h-48 mb-3 rounded-lg overflow-hidden">
                                            <ImageSkeleton />
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleGenerateImage('back', 'back')}
                                            className="w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold text-white uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                                        >
                                            <RefreshCw className="w-3 h-3" />
                                            {book.backCoverImageUrl ? 'Regenerate Back' : 'Generate Back'}
                                        </button>
                                    )}
                                </div>

                                {/* Chapters Grid - Masonry-ish feel */}
                                <div>
                                    <span className="text-xs text-slate-500 font-medium block mt-6 mb-4 uppercase tracking-wider">Chapter Illustrations</span>
                                    <div className="space-y-4">
                                        {book.chapters?.map((chapter, i) => (
                                            <div key={chapter.id} className="bg-slate-900 rounded-xl p-3 border border-slate-800">
                                                <div className="flex gap-4">
                                                    {/* Thumbnail */}
                                                    <div className="w-20 h-20 shrink-0 bg-slate-800 rounded-lg overflow-hidden relative group">
                                                        {isGenerating === chapter.id ? (
                                                            <ImageSkeleton />
                                                        ) : chapter.imageUrl ? (
                                                            <img src={chapter.imageUrl} className="w-full h-full object-cover" alt={chapter.title} />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-700">
                                                                <ImageIcon className="w-6 h-6" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Controls */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="text-xs font-medium text-white truncate w-3/4 block" title={chapter.title}>{chapter.title}</span>
                                                            <button
                                                                onClick={() => handleGenerateImage(chapter.id, 'chapter')}
                                                                disabled={!!isGenerating}
                                                                className="text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                                                                title="Generate Image"
                                                            >
                                                                <Sparkles className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                        <textarea
                                                            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-[10px] text-slate-400 focus:text-slate-200 focus:border-slate-700 outline-none resize-none custom-scrollbar"
                                                            rows={2}
                                                            value={chapter.imagePrompt || ""}
                                                            placeholder="Prompt..."
                                                            onChange={(e) => {
                                                                const newChapters = [...(book.chapters || [])];
                                                                newChapters[i] = { ...chapter, imagePrompt: e.target.value };
                                                                setBook({ ...book, chapters: newChapters });
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT: Live Preview */}
            <div className="lg:col-span-8 flex flex-col h-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden relative shadow-2xl">

                {/* View Controls */}
                <div className="absolute top-6 right-6 z-20 flex bg-slate-800/90 backdrop-blur rounded-lg p-1 border border-slate-700 shadow-lg">
                    <button
                        onClick={() => setPreviewMode('desktop')}
                        className={`p-2 rounded ${previewMode === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        title="Print View"
                    >
                        <Monitor className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setPreviewMode('mobile')}
                        className={`p-2 rounded ${previewMode === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        title="Mobile Reader"
                    >
                        <Smartphone className="w-4 h-4" />
                    </button>
                </div>

                {/* Book Container */}
                <div className="flex-1 overflow-hidden flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-slate-950 p-8">

                    {/* Navigation Left */}
                    <button
                        onClick={prevPage}
                        disabled={currentPage === 0}
                        className="fixed lg:absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/5 hover:bg-white/10 text-white disabled:opacity-0 transition-all z-30 backdrop-blur-sm"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>

                    {/* Navigation Right */}
                    <button
                        onClick={nextPage}
                        disabled={currentPage === totalPages - 1}
                        className="fixed lg:absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/5 hover:bg-white/10 text-white disabled:opacity-0 transition-all z-30 backdrop-blur-sm"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>

                    {/* The Book Page */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentPage}
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className={`
                                transition-all duration-500 ease-in-out bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden
                                ${previewMode === 'mobile' ? 'w-[375px] h-[667px] rounded-3xl' : 'w-[595px] h-[842px] rounded-sm'}
                            `}
                            style={{
                                fontFamily: currentTheme.fontBody,
                                backgroundColor: currentTheme.backgroundColor,
                                color: currentTheme.textColor
                            }}
                        >
                            {renderPageContent()}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Pagination Indicator */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur text-white px-4 py-2 rounded-full text-xs font-medium tracking-widest border border-white/10">
                    {currentPage === 0 ? 'COVER' : currentPage === totalPages - 1 ? 'BACK COVER' : `PAGE ${currentPage} / ${totalPages - 2}`}
                </div>
            </div>
        </div>
    );
};
