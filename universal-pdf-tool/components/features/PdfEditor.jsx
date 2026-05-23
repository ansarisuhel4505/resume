"use client";

import React, { useState } from 'react';
import { FileEdit, Download, Loader2, Type } from 'lucide-react';
import toast from 'react-hot-toast';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import { motion } from 'framer-motion';

export default function PdfEditor({ files }) {
  const [isEditing, setIsEditing] = useState(false);
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");

  const handleEdit = async () => {
    if (files.length === 0) {
      toast.error("Please upload a PDF file.");
      return;
    }

    const file = files[0];
    if (file.type !== 'application/pdf') {
      toast.error("The Advanced Edit tool only supports PDF files.");
      return;
    }

    if (!watermarkText.trim()) {
      toast.error("Please enter some text for the watermark.");
      return;
    }

    setIsEditing(true);
    const toastId = toast.loading("Applying watermark natively in your browser...");

    try {
      // PDF file ko padhna
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      // Har page par loop chala kar Watermark lagana
      pages.forEach((page) => {
        const { width, height } = page.getSize();
        page.drawText(watermarkText.toUpperCase(), {
          x: width / 2 - (watermarkText.length * 10), // Center align attempt
          y: height / 2,
          size: 50,
          color: rgb(0.9, 0.1, 0.1), // Red color
          opacity: 0.3, // 30% transparent
          rotate: degrees(-45), // Tircha draw karna
        });
      });

      // Nayi PDF ko save karna
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      // Auto Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `watermarked-${file.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Watermark applied successfully!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Failed to edit PDF. The file might be encrypted/password protected.", { id: toastId });
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700"
    >
      <FileEdit className="text-purple-500 w-12 h-12 mb-4" />
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 truncate max-w-xs text-center">
        Advanced Edit: {files[0]?.name}
      </h3>

      <div className="w-full max-w-xs mb-6 flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
          <Type size={16} /> Enter Watermark Text:
        </label>
        <input 
          type="text"
          value={watermarkText}
          onChange={(e) => setWatermarkText(e.target.value)}
          placeholder="e.g., CONFIDENTIAL, DRAFT, YOUR NAME"
          className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-darkCard text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary uppercase"
        />
        <p className="text-xs text-emerald-500 text-center font-medium mt-1">
          Watermark will be applied to all pages.
        </p>
      </div>

      <button
        onClick={handleEdit}
        disabled={isEditing || !watermarkText.trim()}
        className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all shadow-md ${
          isEditing || !watermarkText.trim()
            ? 'bg-purple-400 cursor-not-allowed opacity-70'
            : 'bg-purple-600 hover:bg-purple-700 active:scale-95 hover:shadow-lg'
        }`}
      >
        {isEditing ? (
          <>
            <Loader2 className="animate-spin" size={20} /> Editing PDF...
          </>
        ) : (
          <>
            <Download size={20} /> Add Watermark & Download
          </>
        )}
      </button>
    </motion.div>
  );
}
