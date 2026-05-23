"use client";

import React, { useState, useEffect } from 'react';
// Changed FileType2 to FileText to guarantee it exists in all versions
import { ArrowRightLeft, Download, Loader2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function FileConverter({ files }) {
  const [isConverting, setIsConverting] = useState(false);
  const [targetFormat, setTargetFormat] = useState('');
  const [availableFormats, setAvailableFormats] = useState([]);

  // Apna custom logic: Konsi file kisme convert ho sakti hai humare native server par
  useEffect(() => {
    if (files.length === 0) return;
    const file = files[0];
    const name = file.name.toLowerCase();
    
    if (file.type.startsWith('image/') || name.endsWith('.txt')) {
      setAvailableFormats([{ value: 'pdf', label: 'PDF Document (.pdf)' }]);
      setTargetFormat('pdf');
    } else if (name.endsWith('.docx') || name.endsWith('.pdf')) {
      setAvailableFormats([{ value: 'txt', label: 'Plain Text (.txt)' }]);
      setTargetFormat('txt');
    } else if (name.endsWith('.xlsx') || name.endsWith('.csv')) {
      setAvailableFormats([{ value: 'json', label: 'JSON Data (.json)' }]);
      setTargetFormat('json');
    } else {
      setAvailableFormats([]);
      setTargetFormat('');
    }
  }, [files]);

  const handleConvert = async () => {
    if (files.length === 0 || !targetFormat) {
      toast.error("Invalid file or target format.");
      return;
    }

    const file = files[0];
    setIsConverting(true);
    const toastId = toast.loading(`Converting natively: ${file.name} to ${targetFormat.toUpperCase()}...`);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('targetFormat', targetFormat);

      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to convert file.");
      }

      // VANILLA JS DOWNLOAD (No third-party packages needed, 100% crash-free)
      let blob;
      if (targetFormat === 'json') {
        const data = await response.json();
        blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      } else {
        blob = await response.blob();
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const originalName = file.name.split('.')[0];
      a.download = `native-converted-${originalName}.${targetFormat}`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Conversion successful!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error(error.message, { id: toastId });
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
        Convert: {files[0]?.name}
      </h3>

      {availableFormats.length > 0 ? (
        <div className="w-full max-w-xs mb-6 flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <FileText size={16} /> Select Target Format:
          </label>
          <select 
            value={targetFormat}
            onChange={(e) => setTargetFormat(e.target.value)}
            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-darkCard text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary"
          >
            {availableFormats.map(fmt => (
              <option key={fmt.value} value={fmt.value}>{fmt.label}</option>
            ))}
          </select>
          <p className="text-xs text-emerald-500 text-center font-medium mt-1">
            Running 100% locally on your server.
          </p>
        </div>
      ) : (
        <p className="text-sm text-red-500 mb-6 text-center bg-red-50 p-3 rounded-lg border border-red-200">
          Sorry, converting this specific format requires external APIs or heavy servers. Our native code handles Docs, PDFs, and Images.
        </p>
      )}

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
