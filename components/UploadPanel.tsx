
import React, { useRef, useState, useCallback } from 'react';
import { Upload, FileText, Image as ImageIcon, X, Loader2, Database, AlertCircle, FileWarning } from 'lucide-react';
// Fixed: Imported UploadedFile from the correct types.ts where it is defined with 'id' and other required properties
import { UploadedFile } from '../types';

interface UploadPanelProps {
  onFilesReady: (files: UploadedFile[]) => void;
  isAnalyzing: boolean;
}

interface FileWithError extends UploadedFile {
  error?: string;
  size?: number;
}

export const UploadPanel: React.FC<UploadPanelProps> = ({ onFilesReady, isAnalyzing }) => {
  const [files, setFiles] = useState<FileWithError[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
  const ALLOWED_TYPES = [
    'image/jpeg', 'image/png', 'image/jpg', 
    'application/pdf', 'text/plain', 'text/csv'
  ];

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Unsupported format. Use JPG, PNG, PDF, or TXT.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File exceeds 20MB limit.";
    }
    return null;
  };

  const processFiles = async (rawFiles: FileList | File[]) => {
    const newFiles: FileWithError[] = [];
    
    for (const file of Array.from(rawFiles)) {
      const error = validateFile(file);
      const isImage = file.type.startsWith('image/');
      
      let content = "";
      if (!error) {
        content = isImage 
          ? await new Promise<string>((res) => {
              const r = new FileReader();
              r.onloadend = () => res(r.result as string);
              r.readAsDataURL(file);
            })
          : await file.text();
      }

      let category: UploadedFile['category'] = 'other';
      const nameLower = file.name.toLowerCase();
      if (nameLower.includes('note') || nameLower.includes('clinical')) category = 'note';
      else if (nameLower.includes('lab') || nameLower.includes('result')) category = 'lab';
      else if (isImage || nameLower.includes('scan') || nameLower.includes('xray')) category = 'imaging';
      else if (nameLower.includes('genom') || nameLower.includes('dna')) category = 'genomics';

      newFiles.push({ 
        id: Math.random().toString(36).substr(2, 9), 
        name: file.name, 
        type: file.type, 
        content, 
        category,
        size: file.size,
        error: error || undefined
      });
    }
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return "0 KB";
    const kb = bytes / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
  };

  const validFilesOnly = files.filter(f => !f.error);

  return (
    <div className="space-y-8">
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`bg-white p-12 rounded-[3.5rem] border-2 border-dashed transition-all text-center relative overflow-hidden group ${
          isDragging ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-300'
        }`}
      >
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 transition-transform duration-500 ${
          isDragging ? 'bg-indigo-600 text-white scale-110' : 'bg-indigo-50 text-indigo-600'
        }`}>
          <Upload size={36} />
        </div>
        
        <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-3">Initialize Patient Review</h3>
        <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
          Drag and drop clinical records here for synthesis. Support for diagnostic images, pathology notes, and lab data.
        </p>
        
        <div className="mt-8 flex items-center justify-center gap-4">
          <input 
            type="file" 
            multiple 
            className="hidden" 
            ref={inputRef} 
            onChange={(e) => e.target.files && processFiles(e.target.files)} 
          />
          <button 
            onClick={() => inputRef.current?.click()} 
            className="bg-slate-900 text-white font-black py-4 px-10 rounded-2xl hover:bg-indigo-600 transition-all shadow-xl hover:-translate-y-1 active:scale-95"
          >
            Select Clinical Records
          </button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6">
           <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Max 20MB/File
           </div>
           <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300" /> HIPAA Secure
           </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-4 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pending Review Bundle ({files.length})</h4>
            {files.some(f => f.error) && (
              <span className="text-[10px] font-bold text-rose-500 uppercase flex items-center gap-1">
                <AlertCircle size={12} /> {files.filter(f => f.error).length} Invalid items
              </span>
            )}
          </div>

          <div className="space-y-3">
            {files.map(f => (
              <div 
                key={f.id} 
                className={`flex items-center justify-between p-5 rounded-[2rem] border transition-all ${
                  f.error ? 'bg-rose-50 border-rose-100' : 'bg-white border-slate-100 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    f.error ? 'bg-rose-100 text-rose-600' : f.category === 'imaging' ? 'bg-blue-50 text-blue-500' : 'bg-amber-50 text-amber-500'
                  }`}>
                    {f.error ? <FileWarning size={20} /> : f.category === 'imaging' ? <ImageIcon size={20} /> : <FileText size={20} />}
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-black line-clamp-1 ${f.error ? 'text-rose-900' : 'text-slate-800'}`}>{f.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formatSize(f.size)}</span>
                      {!f.error && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg text-[8px] font-black uppercase tracking-tighter">
                          {f.category}
                        </span>
                      )}
                    </div>
                    {f.error && <p className="text-[10px] font-bold text-rose-600 mt-1 uppercase tracking-tight">{f.error}</p>}
                  </div>
                </div>
                <button 
                  onClick={() => setFiles(p => p.filter(x => x.id !== f.id))}
                  className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>

          <button 
            disabled={isAnalyzing || validFilesOnly.length === 0}
            onClick={() => onFilesReady(validFilesOnly)}
            className="w-full bg-indigo-600 text-white font-black py-5 rounded-[2rem] flex items-center justify-center gap-3 mt-8 shadow-2xl shadow-indigo-100 disabled:opacity-50 disabled:grayscale transition-all hover:bg-indigo-700 active:scale-95"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Running Review...</span>
              </>
            ) : (
              <>
                <Database size={20} />
                <span>Initialize Synthesis for Review</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
