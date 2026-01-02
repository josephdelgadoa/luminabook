import React, { useState } from 'react';
import type { EBook } from '@/types';
import { generateImage } from '@/services/ai-service';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Maximize2, Minimize2,
    Wand2, Layers, Type,
    RefreshCw, AlertCircle, CheckCircle2, Image as ImageIcon,
    BookOpen, User, Ratio
} from 'lucide-react';

interface VisualStudioProps {
    book: Partial<EBook>;
    setBook: (book: Partial<EBook>) => void;
}

export const VisualStudio: React.FC<VisualStudioProps> = ({ book, setBook }) => {
    // State
    const [selectedSectionId, setSelectedSectionId] = useState<string | 'cover' | 'back-cover' | 'author-info'>('cover');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [promptText, setPromptText] = useState("");
    const [showUI, setShowUI] = useState(true);
    const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'pocket'>('a4');

    // Derived Selectors
    const isCoverSelected = selectedSectionId === 'cover';
    const isBackCoverSelected = selectedSectionId === 'back-cover';
    const isAuthorInfoSelected = selectedSectionId === 'author-info';
    const selectedChapterIndex = book.chapters?.findIndex(c => c.id === selectedSectionId) ?? -1;
    const selectedChapter = selectedChapterIndex >= 0 ? book.chapters?.[selectedChapterIndex] : null;

    // Helper to update prompt when selection changes
    React.useEffect(() => {
        if (isCoverSelected) {
            setPromptText(book.coverImagePrompt || `Epic cinematic book cover for "${book.title}". Highly detailed, 8k resolution.`);
        } else if (isBackCoverSelected) {
            setPromptText(book.backCoverImagePrompt || `Atmospheric background for back cover of "${book.title}". Minimalist, texture-focused.`);
        } else if (isAuthorInfoSelected) {
            setPromptText(`Professional author portrait of ${book.author || 'the author'}. B&W photography, elegant lighting.`);
        } else if (selectedChapter) {
            setPromptText(selectedChapter.imagePrompt || `Wide cinematic shot for ${selectedChapter.title}. Panoramic, detailed.`);
        }
    }, [selectedSectionId, book.coverImagePrompt, book.backCoverImagePrompt, selectedChapter?.imagePrompt]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);

        try {
            const styleSuffix = (isCoverSelected || isBackCoverSelected || isAuthorInfoSelected) ? "" : ", cinematic panoramic, wide aspect ratio";
            const finalPrompt = promptText + (promptText.includes('aspect') ? '' : styleSuffix);

            const url = await generateImage(finalPrompt);

            if (isCoverSelected) {
                setBook({ ...book, coverImageUrl: url, coverImagePrompt: promptText });
            } else if (isBackCoverSelected) {
                setBook({ ...book, backCoverImageUrl: url, backCoverImagePrompt: promptText });
            } else if (isAuthorInfoSelected) {
                setBook({ ...book, authorImageUrl: url });
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
    const activeImage = isCoverSelected ? book.coverImageUrl : (isBackCoverSelected ? book.backCoverImageUrl : (isAuthorInfoSelected ? book.authorImageUrl : selectedChapter?.imageUrl));

    // Dynamic styles for Trim Size
    const containerWidthDetails = {
        'pocket': 'max-w-[480px]', // 5 inches approx relative
        'letter': 'max-w-4xl',     // 8.5 inches approx relative
        'a4': 'max-w-[850px]'      // 8.27 inches
    };

    // Auto Font Adjustment based on Trim Size (requested by user)
    const fontConfig = {
        'pocket': {
            body: 'text-base leading-relaxed',
            title: 'text-3xl',
            padding: 'p-8 lg:p-10'
        },
        'letter': {
            body: 'text-lg leading-loose',
            title: 'text-5xl',
            padding: 'p-12 lg:p-16'
        },
        'a4': {
            body: 'text-lg leading-loose',
            title: 'text-5xl',
            padding: 'p-12 lg:p-16'
        }
    };

    const currentFont = fontConfig[pageSize];

    return (
        <div className="flex h-full bg-[#0a0a0a] text-white overflow-hidden rounded-2xl border border-white/10 shadow-2xl relative">

            {/* LEFT: THE SCROLLABLE CANVAS (Full Book View - MANUSCRIPT STYLE) */}
            <div className={`relative flex-1 h-full overflow-y-auto custom-scrollbar transition-all duration-500 ease-in-out bg-slate-100 ${showUI ? 'lg:mr-[400px]' : ''}`}>
                {/* Paper Ambient Texture */}
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pointer-events-none fixed" />

                {/* Trim Size Toolbar (Floating) */}
                <div className="sticky top-6 z-40 flex justify-center pointer-events-none">
                    <div className="bg-slate-900/90 backdrop-blur-md text-white p-1.5 rounded-full shadow-2xl flex gap-1 pointer-events-auto border border-white/10">
                        {(['pocket', 'a4', 'letter'] as const).map((size) => (
                            <button
                                key={size}
                                onClick={() => setPageSize(size)}
                                className={`
                                    px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2
                                    ${pageSize === size ? 'bg-amber-500 text-black shadow-lg' : 'hover:bg-white/10 text-white/50'}
                                `}
                            >
                                <Ratio size={12} />
                                {size === 'pocket' ? 'Pocket (5x8)' : size === 'a4' ? 'A4 Standard' : 'US Letter'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={`${containerWidthDetails[pageSize]} mx-auto min-h-full pb-32 pt-12 px-4 md:px-0 relative z-10 transition-all duration-500`}>

                    {/* --- 1. FRONT COVER (Distinct) --- */}
                    <div
                        onClick={() => setSelectedSectionId('cover')}
                        className={`relative group cursor-pointer transition-all duration-300 shadow-2xl mb-16 rounded-sm overflow-hidden ${isCoverSelected ? 'ring-4 ring-amber-500' : 'hover:ring-2 hover:ring-indigo-500/30'}`}
                    >
                        {/* Wrapper to maintain aspect ratio - Full Bleed Logic */}
                        <div className="relative w-full aspect-[2/3] lg:aspect-[16/9] lg:h-[75vh]">
                            {book.coverImageUrl ? (
                                <img src={book.coverImageUrl} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
                            ) : (
                                <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-white/20 group-hover:bg-slate-800 transition-colors">
                                    <ImageIcon size={64} strokeWidth={1} />
                                    <p className="mt-4 text-xs tracking-widest uppercase">Tap to Generate Cover</p>
                                </div>
                            )}

                            {/* Cinematic Overlay - Only text is overlaid, image is full background */}
                            <div className="absolute inset-0 flex flex-col justify-end p-12 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none">
                                <h1 className="font-serif text-5xl lg:text-7xl font-bold text-center text-white drop-shadow-2xl mb-8 leading-tight">
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

                            {/* Quick Action Button (Visible on Hover or Empty) */}
                            {!book.coverImageUrl && (
                                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                                    <div className="bg-amber-500 text-black px-6 py-3 rounded-full font-bold uppercase tracking-widest shadow-2xl flex items-center gap-2 animate-pulse">
                                        <Wand2 size={16} /> Generate Cover
                                    </div>
                                </div>
                            )}
                        </div>

                        {isCoverSelected && (
                            <div className="absolute top-4 right-4 bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2 shadow-lg z-10">
                                <Wand2 size={12} /> EDITING COVER
                            </div>
                        )}
                    </div>

                    {/* --- 2. AUTHOR INFO (New) --- */}
                    <div
                        onClick={() => setSelectedSectionId('author-info')}
                        className={`relative bg-white shadow-xl rounded-sm overflow-hidden transition-all duration-300 border mb-16 ${currentFont.padding} text-center flex flex-col items-center justify-center min-h-[60vh] ${isAuthorInfoSelected ? 'border-amber-500 ring-4 ring-amber-500/20' : 'border-slate-200 hover:border-indigo-300'}`}
                    >
                        <div className="w-32 h-32 lg:w-48 lg:h-48 rounded-full overflow-hidden mb-8 shadow-2xl border-4 border-white ring-1 ring-slate-200 relative bg-slate-100 group cursor-pointer hover:ring-amber-500/50 transition-all">
                            {book.authorImageUrl ? (
                                <img src={book.authorImageUrl} alt="Author" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50 group-hover:bg-slate-100 transition-colors">
                                    <User size={64} />
                                </div>
                            )}

                            {/* Hover Hint */}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Wand2 className="text-white" size={24} />
                            </div>
                        </div>

                        <h2 className="font-serif text-3xl font-bold text-slate-900 mb-2">{book.author || "Author Info"}</h2>
                        <span className="text-xs font-sans tracking-[0.2em] text-slate-400 uppercase mb-8">About the Author</span>

                        <div className={`max-w-md mx-auto text-slate-600 font-serif leading-relaxed italic ${currentFont.body}`}>
                            <p>
                                {book.authorBio || "Joseph Delgado is a visionary creator exploring the intersection of art and technology. This book represents a journey into the imagination."}
                            </p>
                        </div>

                        {isAuthorInfoSelected && (
                            <div className="absolute top-4 right-4 bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2 shadow-lg z-10">
                                <Wand2 size={12} /> EDITING AUTHOR INFO
                            </div>
                        )}
                    </div>

                    {/* --- 3. BOOK CONTENT (Paper Style) --- */}
                    <div className="space-y-16 mb-16">
                        {book.chapters?.map((chapter, index) => {
                            const isSelected = selectedSectionId === chapter.id;

                            return (
                                <div
                                    key={chapter.id || index}
                                    id={`chapter-${chapter.id}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedSectionId(chapter.id || 'cover');
                                    }}
                                    className={`relative bg-white shadow-xl rounded-sm overflow-hidden transition-all duration-300 border ${isSelected ? 'border-amber-500 ring-4 ring-amber-500/20' : 'border-slate-200 hover:border-indigo-300'}`}
                                >
                                    {/* 16:3 Aspect Ratio Image Banner (Requested) */}
                                    <div className="relative w-full aspect-[16/3] bg-slate-100 overflow-hidden group border-b border-slate-100 cursor-pointer">
                                        {chapter.imageUrl ? (
                                            <img src={chapter.imageUrl} alt={chapter.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50 group-hover:bg-slate-100">
                                                <ImageIcon size={32} />
                                                <span className="text-[10px] uppercase tracking-widest mt-2">{chapter.title.includes('Intro') ? 'Introduction Scenery' : '16:3 Visual Scenery'}</span>
                                            </div>
                                        )}

                                        {/* Status Badge */}
                                        {isSelected && (
                                            <div className="absolute top-4 right-4 bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2 shadow-lg z-10">
                                                <Wand2 size={12} /> EDITING
                                            </div>
                                        )}

                                        {/* Hover Overlay for Easy Gen */}
                                        {!chapter.imageUrl && (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
                                                <div className="bg-white/90 backdrop-blur text-black px-4 py-2 rounded-full font-bold text-xs shadow-lg flex items-center gap-2">
                                                    <Wand2 size={12} /> Generate Scene
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Manuscript Paper Content - Auto Font Adjusted */}
                                    <div className={`${currentFont.padding}`}>
                                        {(() => {
                                            // Smart Title Logic
                                            const isIntro = (t: string) => /intro|prologue|prólogo|preface|prefacio/i.test(t);
                                            const isChapterLabeled = (t: string) => /chapter|capítulo|part|parte/i.test(t);

                                            let displayTitle = chapter.title;

                                            if (!isIntro(chapter.title) && !isChapterLabeled(chapter.title)) {
                                                // Count previous non-intro chapters
                                                const prevChapters = book.chapters?.slice(0, index).filter(c => !isIntro(c.title)).length || 0;
                                                const chapterNum = prevChapters + 1;
                                                displayTitle = `Chapter ${chapterNum}: ${chapter.title}`;
                                            }

                                            return (
                                                <h2 className={`font-serif font-bold text-slate-900 mb-8 pb-4 border-b border-slate-900/10 ${currentFont.title}`}>
                                                    {displayTitle}
                                                </h2>
                                            );
                                        })()}

                                        <div className={`text-slate-700 font-serif space-y-6 max-w-none text-justify ${currentFont.body}`}>
                                            {chapter.content?.split('\n').map((para, i) => (
                                                para.trim() && <p key={i}>{para.trim()}</p>
                                            ))}
                                            {!chapter.content && <p className="italic text-slate-400">No content available for this chapter.</p>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Empty Chapter Hint */}
                        {(!book.chapters || book.chapters.length === 0) && (
                            <div className="text-center p-12 text-slate-400 font-serif italic border-2 border-dashed border-slate-300 rounded-xl">
                                No chapters found. Go back to Manuscript to generate or create chapters.
                            </div>
                        )}
                    </div>

                    {/* --- 4. BACK COVER (New) --- */}
                    <div
                        onClick={() => setSelectedSectionId('back-cover')}
                        className={`relative group cursor-pointer transition-all duration-300 shadow-2xl rounded-sm overflow-hidden ${isBackCoverSelected ? 'ring-4 ring-amber-500' : 'hover:ring-2 hover:ring-indigo-500/30'}`}
                    >
                        {/* Wrapper for Back Cover Visual - Matches Front Cover Aspect */}
                        <div className="relative w-full aspect-[2/3] lg:aspect-[16/9] lg:h-[75vh] bg-slate-900 border border-t border-white/5">
                            {book.backCoverImageUrl ? (
                                <img src={book.backCoverImageUrl} alt="Back Cover" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                            ) : (
                                <div className="absolute inset-0 bg-neutral-900 opacity-90 transition-opacity" />
                            )}

                            {/* Back Cover Content Overlay (Blurb) */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-16 lg:p-24 text-center">
                                <div className="max-w-2xl backdrop-blur-md p-10 rounded-xl border border-white/10 bg-black/40 shadow-2xl">
                                    <h3 className="font-sans text-xs tracking-[0.3em] uppercase text-amber-500 mb-6 border-b border-white/10 pb-4 inline-block">About the Book</h3>

                                    <p className="font-serif text-white/90 text-lg leading-loose italic">
                                        {book.description || "Enter a compelling description for your book here..."}
                                    </p>

                                    <div className="mt-12 flex flex-col items-center justify-center opacity-80 gap-3">
                                        {/* Barcode Mockup */}
                                        <div className="h-10 w-48 bg-white flex items-center justify-center p-1 rounded-sm">
                                            <div className="w-full h-full bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/EAN13.svg/1200px-EAN13.svg.png')] bg-cover bg-center" />
                                        </div>
                                        <span className="text-[10px] text-white/50 tracking-widest font-mono">LUMINABOOK PRESS</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {isBackCoverSelected && (
                            <div className="absolute top-4 right-4 bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2 shadow-lg z-10">
                                <Wand2 size={12} /> EDITING BACK COVER
                            </div>
                        )}
                    </div>

                    {/* End of Book Marker */}
                    <div className="flex justify-center pt-16 pb-8 opacity-20 text-slate-400">
                        <BookOpen size={24} />
                    </div>
                </div>

                {/* UI Toggle (Dark on Light) */}
                <button
                    onClick={() => setShowUI(!showUI)}
                    className="fixed top-8 right-8 z-30 p-3 rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow-xl transition-all"
                >
                    {showUI ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
                </button>
            </div>

            {/* RIGHT: ART DIRECTOR PANEL (Stays Dark) */}
            <AnimatePresence>
                {showUI && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="absolute right-0 top-0 bottom-0 w-full lg:w-[400px] bg-black/90 backdrop-blur-xl border-l border-white/10 flex flex-col z-20 shadow-2xl"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
                            <div>
                                <h2 className="text-sm font-bold uppercase tracking-widest text-white/90">Art Director</h2>
                                <p className="text-[10px] text-white/50 mt-1">
                                    {isCoverSelected ? 'Editing: FRONT COVER' :
                                        isAuthorInfoSelected ? 'Editing: AUTHOR INFO' :
                                            isBackCoverSelected ? 'Editing: BACK COVER' :
                                                'Editing: MANUSCRIPT SCENE'}
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
                                    placeholder={
                                        isCoverSelected ? "Describe the front cover..." :
                                            isAuthorInfoSelected ? "Describe the author portrait..." :
                                                isBackCoverSelected ? "Describe the back cover mood..." :
                                                    "Describe the scene..."
                                    }
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
                                        {isCoverSelected || isBackCoverSelected || isAuthorInfoSelected ? '2:3 (Portrait)' : '16:3 (Wide)'}
                                    </div>
                                    <div>
                                        <span className="block text-white/30">Engine</span>
                                        OpenRouter Flux
                                    </div>
                                    <div className="col-span-2 border-t border-white/10 pt-2 flex justify-between">
                                        <span className="block text-white/30">Trim Size</span>
                                        <span className="text-amber-400 font-bold uppercase">{pageSize}</span>
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
