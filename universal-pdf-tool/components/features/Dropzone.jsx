"use client";

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';

export default function Dropzone({ files, setFiles, maxFiles = 5 }) {
  const onDrop = useCallback((acceptedFiles) => {
    setFiles(acceptedFiles.slice(0, maxFiles));
  }, [maxFiles, setFiles]);

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    // THE FIX: Accept All Daily Use Files (Excel, PPT, Word, PDF, Images, Text)
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
    }
  });

  return (
    <div className="w-full">
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          isDragActive ? 'border-primary bg-blue-50 dark:bg-blue-900/20' : 'border-slate-300 dark:border-slate-700 hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-800/50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full text-primary">
            <UploadCloud size={32} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Drag & Drop files here
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Supports Excel, PPT, Word, PDF, Images, and Text.
            </p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-6">
          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
            Selected Files ({files.length})
          </h4>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-primary rounded-lg shrink-0">
                    <FileIcon size={18} />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors shrink-0"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
