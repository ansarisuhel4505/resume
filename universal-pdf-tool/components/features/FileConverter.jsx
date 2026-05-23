"use client";

import React, { useState } from 'react';
import { ArrowRightLeft, Download, Loader2, FileType2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function FileConverter({ files }) {
  const [isConverting, setIsConverting] = useState(false);
  const [targetFormat, setTargetFormat] = useState('');

  const handleConvert = async () => {
    if (files.length === 0) {
      toast.error("Please upload a file.");
      return;
    }
    if (!targetFormat.trim()) {
      toast.error("Please enter a target format (e.g., pdf, mp4, mp3).");
      return;
    }

    const file = files[0];
    setIsConverting(true);
    const toastId = toast.loading(`Converting ${file.name} to ${targetFormat.toUpperCase()}...`);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('targetFormat', targetFormat.replace('.', '').trim()); // Remove dot if user adds it

      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to convert file.");
      }

      // Automatically trigger download using the returned CloudConvert URL
      const a = document.createElement('a');
      a.href = data.downloadUrl;
      a.download = data.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast.success("Conversion successful! Download starting...", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error(error.message, { id: toastId, duration: 6000 });
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700"
    >
      <ArrowRightLeft className="text-blue-500 w-12 h-12 mb-4" />
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 truncate max-w-xs text-center">
        Universal File: {files[0]?.name}
      </h3>

      <div className="w-full max-w-xs mb-6 flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
          <FileType2 size={16} /> Enter ANY Target Format:
        </label>
        <input 
          type="text"
          placeholder="e.g., pdf, mp4, mp3, docx, png"
          value={targetFormat}
          onChange={(e) => setTargetFormat(e.target.value)}
          className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-darkCard text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary uppercase"
        />
        <p className="text-xs text-slate-500 text-center mt-1">
          Powered by CloudConvert. Supports 200+ formats.
        </p>
      </div>

      <button
        onClick={handleConvert}
        disabled={isConverting || !targetFormat}
        className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all shadow-md ${
          isConverting || !targetFormat
            ? 'bg-blue-400 cursor-not-allowed opacity-70'
            : 'bg-blue-600 hover:bg-blue-700 active:scale-95 hover:shadow-lg'
        }`}
      >
        {isConverting ? (
          <>
            <Loader2 className="animate-spin" size={20} /> Processing...
          </>
        ) : (
          <>
            <Download size={20} /> Convert & Download
          </>
        )}
      </button>
    </motion.div>
  );
}
