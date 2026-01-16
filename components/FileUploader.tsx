
import React, { useRef, useState } from 'react';
import { Upload, FileText, Image as ImageIcon, X, Loader2, Database } from 'lucide-react';
import { UploadedFile } from '../types';

interface FileUploaderProps {
  onFilesReady: (files: UploadedFile[]) => void;
  isAnalyzing: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFilesReady, isAnalyzing }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const newFiles: UploadedFile[] = [];
    for (let i = 0; i < e.target.files.length; i++) {
      const file = e.target.files[i];
      const isImage = file.type.startsWith('image/');
      
      let content = "";
      if (isImage) {
        content = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      } else {
        content = await file.text();
      }

      let category: UploadedFile['category'] = 'other';
      if (file.name.toLowerCase().includes('note')) category = 'note';
      else if (file.name.toLowerCase().includes('lab')) category = 'lab';
      else if (file.name.toLowerCase().includes('scan') || isImage) category = 'imaging';
      else if (file.name.toLowerCase().includes('genom')) category = 'genomics';

      newFiles.push({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        content,
        category
      });
    }
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-slate-200 hover:border-indigo-400 transition-colors">
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
          <Upload size={32} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800">Upload Health Records</h3>
          <p className="text-slate-500 text-sm mt-1">
            Support for Patient Notes (TXT/PDF), Lab Results (CSV/JSON),<br />
            Diagnostic Images (X-Ray/MRI), and Genomics Data.
          </p>
        </div>
        
        <input 
          type="file" 
          multiple 
          className="hidden" 
          ref={inputRef}
          onChange={handleFileChange}
        />
        
        <button 
          onClick={() => inputRef.current?.click()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-indigo-200 flex items-center gap-2"
        >
          Select Files
        </button>

        {files.length > 0 && (
          <div className="w-full mt-8 space-y-3 max-w-2xl text-left">
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider px-2">Pending Records ({files.length})</h4>
            <div className="space-y-2">
              {files.map(file => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                  <div className="flex items-center gap-3">
                    {file.type.startsWith('image/') ? (
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                        <ImageIcon size={18} />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                        <FileText size={18} />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-slate-800 line-clamp-1">{file.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{file.category}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeFile(file.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
            
            <button 
              disabled={isAnalyzing}
              onClick={() => onFilesReady(files)}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-xl shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Analyzing with Medical AI...
                </>
              ) : (
                <>
                  <Database size={20} />
                  Generate Comprehensive Dashboard
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
