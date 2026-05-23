"use client";

import React, { useState } from 'react';
import { Minimize, Download, Loader2, FileCheck2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PDFDocument } from 'pdf-lib';
import { motion } from 'framer-motion';

export default function PdfCompressor({ files }) {
  const [isCompressing, setIsCompressing] = useState(false);
  const [stats, setStats] = useState(null);

  const handleCompress = async () => {
    if (files.length === 0) {
      toast.error("Please upload a PDF file to compress.");
      return;
    }

    const file = files[0];
    
    if (file.type !== 'application/pdf') {
      toast.error("Compress tool currently only supports PDF files.");
      return;
    }

    setIsCompressing(true);
    const toastId = toast.loading("Compressing PDF natively in browser...");

    try {
      const arrayBuffer = await file.arrayBuffer();
      const originalPdf = await PDFDocument.load(arrayBuffer);
      
      // Basic Native Compression: Rebuild the PDF and remove unused objects
      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(originalPdf, originalPdf.getPageIndices());
      
      copiedPages.forEach((page) => {
        newPdf.addPage(page);
      });

      // Save with useObjectStreams to heavily compress the internal structure
      const pdfBytes = await newPdf.save({ useObjectStreams: true });
      
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      const originalSize = (file.size / 1024 / 1024).toFixed(2);
      const newSize = (blob.size / 1024 / 1024).toFixed(2);
      
      setStats({ old: originalSize, new: newSize });

      // Auto Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compressed-${file.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Success! Reduced to ${newSize}MB`, { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Failed to compress this PDF. It might be encrypted or corrupted.", { id: toastId });
    } finally {
      setIsCompressing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700"
    >
      <Minimize className="text-amber-500 w-12 h-12 mb-4" />
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 truncate max-w-xs text-center">
        Compress: {files[0]?.name}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-sm mb-6">
        Reduce file size by optimizing the internal PDF structure securely in your browser.
      </p>

      {stats && (
        <div className="flex items-center gap-4 mb-6 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800/50">
          <div className="flex flex-col items-center">
            <span className="text-xs text-slate-500 dark:text-slate-400">Original</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">{stats.old} MB</span>
          </div>
          <ArrowRightLeft size={16} className="text-amber-500" />
          <div className="flex flex-col items-center">
            <span className="text-xs text-slate-500 dark:text-slate-400">Compressed</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{stats.new} MB</span>
          </div>
        </div>
      )}

      <button
        onClick={handleCompress}
        disabled={isCompressing || files.length === 0}
        className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all shadow-md ${
          isCompressing || files.length === 0
            ? 'bg-amber-400 cursor-not-allowed opacity-70'
            : 'bg-amber-600 hover:bg-amber-700 active:scale-95 hover:shadow-lg'
        }`}
      >
        {isCompressing ? (
          <>
            <Loader2 className="animate-spin" size={20} /> Compressing...
          </>
        ) : (
          <>
            <Download size={20} /> Compress & Download
          </>
        )}
      </button>
    </motion.div>
  );
}
