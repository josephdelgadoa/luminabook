import { useState } from 'react';
import { Shell } from './components/layout/Shell';
import { ManuscriptArchitect } from './components/steps/ManuscriptArchitect';
import { VisualStudio } from './components/steps/VisualStudio';
import { ExportArchitect } from './components/steps/ExportArchitect';
import type { AppStep, EBook } from './types';

function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>('manuscript');
  const [book, setBook] = useState<Partial<EBook>>({
    theme: {
      id: 'modern',
      name: 'Modern Slate',
      fontHeading: 'Playfair Display',
      fontBody: 'Inter',
      primaryColor: '#4f46e6',
      backgroundColor: '#f8fafc',
      textColor: '#1e293b'
    }
  });

  const renderStep = () => {
    switch (currentStep) {
      case 'manuscript':
        return <ManuscriptArchitect book={book} setBook={setBook} onNext={() => setCurrentStep('visual')} />;
      case 'visual':
        return <VisualStudio book={book} setBook={setBook} />;
      case 'export':
        return <ExportArchitect book={book} />;
      default:
        return <ManuscriptArchitect book={book} setBook={setBook} onNext={() => setCurrentStep('visual')} />;
    }
  };

  return (
    <Shell currentStep={currentStep}>
      {renderStep()}

      {/* Navigation Controls */}
      <div className="fixed bottom-8 right-8 flex gap-3 bg-white p-2 rounded-2xl shadow-xl border border-slate-200 z-50">
        <button
          onClick={() => setCurrentStep('manuscript')}
          className={`
            px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2
            ${currentStep === 'manuscript'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
              : 'text-slate-600 hover:bg-slate-100'
            }
          `}
        >
          <span className="w-5 h-5 flex items-center justify-center rounded-full bg-current opacity-20 text-[10px]">1</span>
          Manuscript
        </button>
        <button
          onClick={() => setCurrentStep('visual')}
          className={`
            px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2
            ${currentStep === 'visual'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
              : 'text-slate-600 hover:bg-slate-100'
            }
          `}
        >
          <span className="w-5 h-5 flex items-center justify-center rounded-full bg-current opacity-20 text-[10px]">2</span>
          Visual
        </button>
        <button
          onClick={() => setCurrentStep('export')}
          className={`
            px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2
            ${currentStep === 'export'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
              : 'text-slate-600 hover:bg-slate-100'
            }
          `}
        >
          <span className="w-5 h-5 flex items-center justify-center rounded-full bg-current opacity-20 text-[10px]">3</span>
          Export
        </button>
      </div>
    </Shell>
  );
}

export default App;
