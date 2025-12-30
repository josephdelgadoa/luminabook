import React, { useState } from 'react';
import type { EBook, ExportConfig } from '@/types';
import { generatePDF } from '@/services/pdf-service';
import { FileText, Smartphone, Printer, Check, Settings, Download } from 'lucide-react';

interface ExportArchitectProps {
    book: Partial<EBook>;
}

export const ExportArchitect: React.FC<ExportArchitectProps> = ({ book }) => {
    const [config, setConfig] = useState<ExportConfig>({
        format: 'pdf',
        pageSize: 'a4',
        bleed: true
    });
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        // Simulate export delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        await generatePDF(book as EBook, config);
        setIsExporting(false);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            {/* Left: Configuration */}
            <div className="flex flex-col gap-6">
                <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700">
                    <h2 className="text-2xl font-serif text-white mb-6 flex items-center gap-2">
                        <Settings className="w-6 h-6 text-indigo-400" />
                        Export Configuration
                    </h2>

                    {/* Format Selection */}
                    <div className="mb-8">
                        <label className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-3 block">Distribution Format</label>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={() => setConfig({ ...config, format: 'pdf' })}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${config.format === 'pdf' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                            >
                                <Printer className="w-6 h-6" />
                                <span className="text-xs font-bold">Print PDF</span>
                            </button>
                            <button
                                onClick={() => setConfig({ ...config, format: 'epub' })}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${config.format === 'epub' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                            >
                                <Smartphone className="w-6 h-6" />
                                <span className="text-xs font-bold">EPUB 3.0</span>
                            </button>
                            <button
                                onClick={() => setConfig({ ...config, format: 'kpf' })}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${config.format === 'kpf' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                            >
                                <FileText className="w-6 h-6" />
                                <span className="text-xs font-bold">Kindle KPF</span>
                            </button>
                        </div>
                    </div>

                    {/* Print Settings (Only for PDF) */}
                    {config.format === 'pdf' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                            <div>
                                <label className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-3 block">Trim Size</label>
                                <select
                                    value={config.pageSize}
                                    onChange={(e) => setConfig({ ...config, pageSize: e.target.value as any })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                >
                                    <option value="a4">A4 Standard (210 x 297 mm)</option>
                                    <option value="letter">US Letter (8.5 x 11 in)</option>
                                    <option value="pocket">Pocket Novel (5 x 8 in)</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-700">
                                <div>
                                    <div className="text-sm font-medium text-white">Full Bleed</div>
                                    <div className="text-xs text-slate-500">Add 0.125" bleed for professional printing</div>
                                </div>
                                <button
                                    onClick={() => setConfig({ ...config, bleed: !config.bleed })}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${config.bleed ? 'bg-indigo-600' : 'bg-slate-700'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${config.bleed ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="w-full py-5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl shadow-xl shadow-indigo-500/20 font-bold text-lg hover:from-indigo-500 hover:to-indigo-400 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isExporting ? (
                        <>
                            <Printer className="w-6 h-6 animate-pulse" />
                            Rendering Masterpiece...
                        </>
                    ) : (
                        <>
                            <Download className="w-6 h-6" />
                            Export Publish-Ready File
                        </>
                    )}
                </button>
            </div>

            {/* Right: Summary Card */}
            <div className="bg-white text-slate-900 rounded-xl p-8 shadow-2xl relative overflow-hidden flex flex-col">
                <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />

                <div className="mb-8 text-center pt-8">
                    <h3 className="text-3xl font-serif font-bold mb-2">{book.title || "Untitled Book"}</h3>
                    <p className="text-slate-500 uppercase tracking-widest text-sm">{book.author || "Joseph Delgado"}</p>
                </div>

                <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                        <span className="text-slate-500">Total Chapters</span>
                        <span className="font-mono font-medium">{book.chapters?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                        <span className="text-slate-500">Selected Theme</span>
                        <span className="font-mono font-medium">{book.theme?.name || "Default"}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                        <span className="text-slate-500">Export Format</span>
                        <span className="font-mono font-medium uppercase">{config.format}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                        <span className="text-slate-500">Trim Size</span>
                        <span className="font-mono font-medium uppercase">{config.pageSize}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                        <span className="text-slate-500">Est. Parsing Engine</span>
                        <span className="font-mono font-medium text-indigo-600">jsPDF v3.0</span>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 mt-8 flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-600">
                        Your manuscript has been structured and validated. All assets are print-ready compliant with Amazon KDP standards.
                    </p>
                </div>
            </div>
        </div>
    );
};
