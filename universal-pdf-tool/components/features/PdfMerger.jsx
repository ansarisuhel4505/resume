"use client";

import React, { useState } from 'react';
import { mergePdfs } from '../../utils/pdfEditor';
import { saveAs } from 'file-saver';
import { Layers, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function PdfMerger({ files, onComplete }) {
  const [isMerging, setIsMerging] = useState(false);

  const handleMerge = async () => {
    if (files.length < 2) {
      toast.error("Please upload at least 2 PDF files to merge.");
      return;
    }

    // Verify all files are PDFs
    const allPdfs = files.every(file => file.type === 'application/pdf');
    if (!allPdfs) {
      toast.error("All files must be PDF documents for merging.");
      return;
    }

    setIsMerging(true);
    const toastId = toast.loading("Merging PDFs in your browser. Please wait...");

    try {
      // Call the client-side merge utility
      const mergedPdfBlob = await mergePdfs(files);
      
      // Download the file directly
      saveAs(mergedPdfBlob, `merged-document-${Date.now()}.pdf`);
      
      toast.success("PDFs merged successfully!", { id: toastId });
      
      // Optional: callback to clear files from parent component
      if (onComplete) onComplete();
    } catch (error) {
      console.error(error);
      toast.error("Failed to merge PDFs. They might be corrupted or protected.", { id: toastId });
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700"
    >
      <Layers className="text-emerald-500 w-12 h-12 mb-4" />
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
        Ready to Merge {files.length} Files
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-md mb-6">
        Merging happens securely in your browser. Your files never leave your device, saving server limits and ensuring extreme privacy.
      </p>

      <button
        onClick={handleMerge}
        disabled={isMerging || files.length < 2}
        className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all shadow-md ${
          isMerging || files.length < 2
            ? 'bg-emerald-400 cursor-not-allowed opacity-70'
            : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 hover:shadow-lg'
        }`}
      >
        {isMerging ? (
          <>
            <Loader2 className="animate-spin" size={20} /> Processing...
          </>
        ) : (
          <>
            <Download size={20} /> Merge & Download
          </>
        )}
      </button>
    </motion.div>
  );
}
