"use client";

import React, { useState } from 'react';
import { ScanText, Copy, CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function OcrExtractor({ files }) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const handleExtract = async () => {
    if (files.length === 0) {
      toast.error("Please upload an image file first.");
      return;
    }

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast.error("OCR currently works best with Image files (JPG, PNG).");
      return;
    }

    setIsExtracting(true);
    setExtractedText("");
    const toastId = toast.loading("Analyzing image and extracting text...");

    try {
      // Prepare form data for API
      const formData = new FormData();
      formData.append('file', file);

      // Call our Next.js API Route
      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to extract text");
      }

      setExtractedText(data.extractedText);
      toast.success("Text extracted successfully!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error(error.message || "An error occurred during OCR.", { id: toastId });
    } finally {
      setIsExtracting(false);
    }
  };

  const copyToClipboard = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setIsCopied(true);
    toast.success("Text copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 flex flex-col w-full"
    >
      {!extractedText && (
        <div className="flex justify-center mb-6">
          <button
            onClick={handleExtract}
            disabled={isExtracting || files.length === 0}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all shadow-md ${
              isExtracting || files.length === 0
                ? 'bg-rose-400 cursor-not-allowed opacity-70'
                : 'bg-rose-600 hover:bg-rose-700 active:scale-95 hover:shadow-lg'
            }`}
          >
            {isExtracting ? (
              <>
                <Loader2 className="animate-spin" size={20} /> Extracting...
              </>
            ) : (
              <>
                <ScanText size={20} /> Extract Text Now
              </>
            )}
          </button>
        </div>
      )}

      {extractedText && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm"
        >
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
            <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <ScanText size={18} className="text-rose-500" /> Extracted Result
            </span>
            <button 
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-200"
            >
              {isCopied ? <CheckCircle size={16} className="text-emerald-500" /> : <Copy size={16} />}
              {isCopied ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="p-4">
            <textarea 
              readOnly
              value={extractedText}
              className="w-full h-64 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/50 text-slate-800 dark:text-slate-100 resize-none font-mono text-sm"
            />
          </div>
          <div className="p-4 pt-0 flex justify-end">
            <button
               onClick={() => setExtractedText("")}
               className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              Clear Result
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
