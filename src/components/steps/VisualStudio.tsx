import React, { useState } from 'react';
import type { EBook, BookTheme, Chapter } from '@/types';
import { generateImage } from '@/services/ai-service';
import { Type, Image as ImageIcon, Sparkles, RefreshCw, Smartphone, Monitor, ChevronLeft, ChevronRight, LayoutTemplate } from 'lucide-react';

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
        fontHeading: '"Playfair Display", serif',
        fontBody: '"Playfair Display", serif',
        primaryColor: '#be123c',
        backgroundColor: '#fff1f2',
        textColor: '#4c0519'
    }
];

export const VisualStudio: React.FC<VisualStudioProps> = ({ book, setBook }) => {
    const [activeTab, setActiveTab] = useState<'theme' | 'images'>('theme');
    const [isGenerating, setIsGenerating] = useState<string | null>(null); // 'cover', 'back', or chapterId
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
    const [currentPage, setCurrentPage] = useState(0); // 0 = Cover, 1...N = Chapters, N+1 = Back Cover

    const totalPages = (book.chapters?.length || 0) + 2; // Cover + Chapters + Back

    const handleThemeChange = (theme: BookTheme) => {
        setBook({ ...book, theme });
    };

    const handleGenerateImage = async (target: 'cover' | 'back' | string, type: 'cover' | 'back' | 'chapter') => {
        setIsGenerating(target);
        try {
            let prompt = "";
            if (type === 'cover') {
                prompt = `Book cover for "${book.title}", ${book.theme?.name} style. Minimalist, premium, cinematic lighting.`;
                const url = await generateImage(prompt);
                setBook({ ...book, coverImageUrl: url, coverImagePrompt: prompt });
            } else if (type === 'back') {
                prompt = `Back book cover for "${book.title}", ${book.theme?.name} style. Matching front cover aesthetic, clean layout for blurb.`;
                const url = await generateImage(prompt);
                setBook({ ...book, backCoverImageUrl: url, backCoverImagePrompt: prompt });
            } else {
                // Target is chapter ID
                const chapter = book.chapters?.find(c => c.id === target);
                if (chapter) {
                    prompt = `Chapter illustration for "${chapter.title}": ${chapter.summary}. ${book.theme?.name} style, artistic, evocative.`;
                    const url = await generateImage(prompt);

                    const updatedChapters = book.chapters?.map(c =>
                        c.id === target ? { ...c, imageUrl: url, imagePrompt: prompt } : c
                    );
                    setBook({ ...book, chapters: updatedChapters });
                }
            }
        } catch (e) {
            console.error(e);
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
            // FRONT COVER
            return (
                <div className="h-full flex flex-col relative overflow-hidden">
                    {book.coverImageUrl && (
                        <div className="absolute inset-0 z-0">
                            <img src={book.coverImageUrl} className="w-full h-full object-cover opacity-80" alt="Cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
                        </div>
                    )}
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center z-10 relative">
                        <h1
                            className="text-5xl md:text-6xl font-bold mb-6 leading-tight drop-shadow-2xl"
                            style={{
                                fontFamily: currentTheme.fontHeading,
                                color: book.coverImageUrl ? '#fff' : currentTheme.primaryColor
                            }}
                        >
                            {book.title || "Untitled Book"}
                        </h1>
                        <div className="w-16 h-1 bg-current opacity-80 my-8 mx-auto shadow-lg" style={{ color: book.coverImageUrl ? '#fff' : currentTheme.primaryColor }} />
                        <p className={`text-xl uppercase tracking-[0.2em] font-medium ${book.coverImageUrl ? 'text-white' : 'opacity-80'}`}>
                            {book.author || "Joseph Delgado"}
                        </p>
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
                                <span className="text-xs font-bold uppercase tracking-widest opacity-40 mb-2 block">Chapter {chapterIndex + 1}</span>
                                <h2
                                    className="text-3xl md:text-4xl font-bold mb-8"
                                    style={{ fontFamily: currentTheme.fontHeading, color: currentTheme.primaryColor }}
                                >
                                    {chapter.title}
                                </h2>
                                {chapter.imageUrl && (
                                    <div className="mb-8 rounded-lg overflow-hidden shadow-lg border border-slate-100">
                                        <img src={chapter.imageUrl} alt={chapter.title} className="w-full h-auto object-cover max-h-[300px]" />
                                    </div>
                                )}
                            </div>

                            <div
                                className="prose prose-slate prose-lg max-w-none text-justify leading-loose"
                                style={{ fontFamily: currentTheme.fontBody }}
                            >
                                {chapter.content.split('\n').map((para, i) => (
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
                <div className="bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 flex-1 shadow-2xl">
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
                                        {book.coverImageUrl && <span className="text-xs text-green-400 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Ready</span>}
                                    </div>
                                    <button
                                        onClick={() => handleGenerateImage('cover', 'cover')}
                                        disabled={!!isGenerating}
                                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold text-white uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isGenerating === 'cover' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                        {book.coverImageUrl ? 'Regenerate Cover' : 'Generate Cover'}
                                    </button>
                                </div>

                                {/* Back Cover */}
                                <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium text-white">Back Cover</span>
                                        {book.backCoverImageUrl && <span className="text-xs text-green-400 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Ready</span>}
                                    </div>
                                    <button
                                        onClick={() => handleGenerateImage('back', 'back')}
                                        disabled={!!isGenerating}
                                        className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold text-white uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isGenerating === 'back' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                        {book.backCoverImageUrl ? 'Regenerate Back' : 'Generate Back'}
                                    </button>
                                </div>

                                {/* Chapters */}
                                <div className="space-y-2">
                                    <span className="text-xs text-slate-500 font-medium block mt-6 mb-2">CHAPTER ILLUSTRATIONS</span>
                                    {book.chapters?.map((chapter, i) => (
                                        <div key={chapter.id} className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-lg group hover:border-slate-600 transition-colors">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={`w-8 h-8 rounded bg-slate-800 flex items-center justify-center shrink-0 ${chapter.imageUrl ? 'border border-green-500/50' : ''}`}>
                                                    {chapter.imageUrl ? <img src={chapter.imageUrl} className="w-full h-full object-cover rounded" /> : <span className="text-xs text-slate-500">{i + 1}</span>}
                                                </div>
                                                <span className="text-sm text-slate-300 truncate">{chapter.title}</span>
                                            </div>
                                            <button
                                                onClick={() => handleGenerateImage(chapter.id, 'chapter')}
                                                disabled={!!isGenerating}
                                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                                            >
                                                {isGenerating === chapter.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                            </button>
                                        </div>
                                    ))}
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
                    <div
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
                    </div>
                </div>

                {/* Pagination Indicator */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur text-white px-4 py-2 rounded-full text-xs font-medium tracking-widest border border-white/10">
                    {currentPage === 0 ? 'COVER' : currentPage === totalPages - 1 ? 'BACK COVER' : `PAGE ${currentPage} / ${totalPages - 2}`}
                </div>
            </div>
        </div>
    );
};

