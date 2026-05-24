"use client";

import React, { useState } from 'react';
import { Layers, Download, Loader2, Scissors, FilePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { PDFDocument } from 'pdf-lib';
import { motion } from 'framer-motion';

export default function PdfMerger({ files, onComplete }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [pageRange, setPageRange] = useState("");
  
  // LOGIC: 1 file = Split Mode, Multiple files = Merge Mode
  const isSplitMode = files.length === 1;

  const triggerDownload = (blob, originalName, prefix) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prefix}-${originalName}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Helper function to convert "1-3, 5" into exact page array [0, 1, 2, 4]
  const parsePageRange = (rangeStr, maxPages) => {
    if (!rangeStr.trim()) {
       // Agar khali chhod diya toh saare pages
       return Array.from({length: maxPages}, (_, i) => i);
    }
    const pages = new Set();
    const parts = rangeStr.split(',');
    
    for (let part of parts) {
      part = part.trim();
      if (part.includes('-')) {
        let [start, end] = part.split('-').map(n => parseInt(n));
        if (isNaN(start) || isNaN(end)) continue;
        start = Math.max(1, start);
        end = Math.min(maxPages, end);
        for (let i = start; i <= end; i++) {
          pages.add(i - 1); // pdf-lib pages are 0-indexed
        }
      } else {
        const page = parseInt(part);
        if (!isNaN(page) && page >= 1 && page <= maxPages) {
          pages.add(page - 1);
        }
      }
    }
    return Array.from(pages).sort((a, b) => a - b);
  };

  const handleProcess = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    
    try {
      if (isSplitMode) {
        // ==========================================
        // SPLIT / EXTRACT LOGIC
        // ==========================================
        const file = files[0];
        const toastId = toast.loading("Extracting pages...");
        
        if (file.type !== 'application/pdf') {
            toast.error("Split only works on PDF files.", { id: toastId });
            setIsProcessing(false); return;
        }

        const arrayBuffer = await file.arrayBuffer();
        const originalPdf = await PDFDocument.load(arrayBuffer);
        const totalPages = originalPdf.getPageCount();
        
        const pagesToExtract = parsePageRange(pageRange, totalPages);
        
        if (pagesToExtract.length === 0) {
          toast.error(`Invalid pages. Enter numbers between 1 and ${totalPages}.`, { id: toastId });
          setIsProcessing(false);
          return;
        }

        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(originalPdf, pagesToExtract);
        copiedPages.forEach((page) => newPdf.addPage(page));
        
        const pdfBytes = await newPdf.save();
        triggerDownload(new Blob([pdfBytes], { type: 'application/pdf' }), file.name, 'split');
        
        toast.success("Pages extracted successfully!", { id: toastId });
      } else {
        // ==========================================
        // MERGE LOGIC
        // ==========================================
        const toastId = toast.loading(`Merging ${files.length} PDFs...`);
        const mergedPdf = await PDFDocument.create();
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file.type !== 'application/pdf') {
              toast.error(`Skipped ${file.name} (Not a PDF)`, { id: toastId });
              continue;
          }
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await PDFDocument.load(arrayBuffer);
          const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
        
        const pdfBytes = await mergedPdf.save();
        triggerDownload(new Blob([pdfBytes], { type: 'application/pdf' }), "merged-document.pdf", 'merged');
        
        toast.success("PDFs merged successfully!", { id: toastId });
        if (onComplete) onComplete();
      }
    } catch (error) {
      console.error(error);
      toast.error("Process failed. File might be encrypted.", { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
      
      {isSplitMode ? (
        <Scissors className="text-emerald-500 w-12 h-12 mb-4" />
      ) : (
        <Layers className="text-emerald-500 w-12 h-12 mb-4" />
      )}
      
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 truncate max-w-xs text-center">
        {isSplitMode ? "Split / Extract PDF" : "Merge PDFs"}
      </h3>
      
      <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-sm mb-6">
        {isSplitMode 
          ? "Extract specific pages from your PDF to create a new one." 
          : `Combine ${files.length} PDFs into a single document.`}
      </p>

      {/* INPUT BOX FOR SPLIT MODE ONLY */}
      {isSplitMode && (
        <div className="w-full max-w-xs mb-6 flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Pages to Extract (e.g., 1-3, 5):
          </label>
          <input 
            type="text"
            value={pageRange}
            onChange={(e) => setPageRange(e.target.value)}
            placeholder="e.g., 1-3, 5 (Leave blank for all)"
            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-darkCard text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
        </div>
      )}

      <button
        onClick={handleProcess}
        disabled={isProcessing}
        className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all shadow-md ${
          isProcessing
            ? 'bg-emerald-400 cursor-not-allowed opacity-70'
            : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 hover:shadow-lg'
        }`}
      >
        {isProcessing ? (
          <><Loader2 className="animate-spin" size={20} /> Processing...</>
        ) : (
          isSplitMode ? <><Scissors size={20} /> Extract & Download</> : <><FilePlus size={20} /> Merge & Download</>
        )}
      </button>

    </motion.div>
  );
}
