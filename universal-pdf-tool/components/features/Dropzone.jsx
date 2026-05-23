"use client";

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File as FileIcon, X, FileCheck2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function Dropzone({ files, setFiles, maxFiles = 10, acceptedTypes }) {
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      toast.error("Some files were rejected. Check file type and size.");
    }
    
    if (files.length + acceptedFiles.length > maxFiles) {
      toast.error(`You can only upload up to ${maxFiles} files at a time.`);
      return;
    }

    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, [files, maxFiles, setFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes,
    maxFiles: maxFiles - files.length,
  });

  const removeFile = (indexToRemove) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      <div 
        {...getRootProps()} 
        className={`relative w-full p-10 border-2 border-dashed rounded-2xl transition-all duration-300 ease-in-out cursor-pointer flex flex-col items-center justify-center text-center overflow-hidden
          ${isDragActive 
            ? 'border-primary bg-blue-50 dark:bg-blue-900/20' 
            : 'border-slate-300 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-darkCard dark:hover:bg-slate-800/80'
          }
        `}
      >
        <input {...getInputProps()} />
        
        <motion.div 
          animate={{ y: isDragActive ? -10 : 0, scale: isDragActive ? 1.1 : 1 }}
          className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-sm mb-4"
        >
          <UploadCloud className={`w-10 h-10 ${isDragActive ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`} />
        </motion.div>
        
        <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">
          {isDragActive ? "Drop your files here!" : "Drag & Drop files here"}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
          or click to browse from your device. Supports PDF, Word, Images, and more.
        </p>
      </div>

      {/* File Previews List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 space-y-3"
          >
            <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <FileCheck2 size={16} /> Selected Files ({files.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {files.map((file, index) => (
                <motion.div
                  key={`${file.name}-${index}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center justify-between p-3 bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 p-2 rounded-lg shrink-0">
                      <FileIcon size={20} />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                        {file.name}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                  >
                    <X size={18} />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
