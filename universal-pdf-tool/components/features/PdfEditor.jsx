"use client";

import React, { useState } from 'react';
import { FileEdit, Download, Loader2, Type, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { motion } from 'framer-motion';

export default function PdfEditor({ files }) {
  const [isEditing, setIsEditing] = useState(false);
  const [watermarkText, setWatermarkText] = useState("Apna College");
  const [addPageNumbers, setAddPageNumbers] = useState(false);

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

    if (!watermarkText.trim() && !addPageNumbers) {
      toast.error("Please add a watermark or select page numbers.");
      return;
    }

    setIsEditing(true);
    const toastId = toast.loading("Applying advanced edits natively...");

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const totalPages = pages.length;

      // Embed Bold Font for Professional Look
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const normalFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      const textSize = 70; // Bada aur bold text
      const text = watermarkText.trim().toUpperCase();
      const textWidth = font.widthOfTextAtSize(text, textSize);
      const textHeight = font.heightAtSize(textSize);
      
      // Trigonometry math to exact center diagonally rotated text (45 degrees)
      const angleInRadians = Math.PI / 4; 
      const cos45 = Math.cos(angleInRadians);
      const sin45 = Math.sin(angleInRadians);

      pages.forEach((page, index) => {
        const { width, height } = page.getSize();

        // 1. APPLY PRO WATERMARK
        if (text) {
          const xPos = (width / 2) - ((textWidth / 2) * cos45) + ((textHeight / 2) * sin45);
          const yPos = (height / 2) - ((textWidth / 2) * sin45) - ((textHeight / 2) * cos45);

          page.drawText(text, {
            x: xPos,
            y: yPos,
            size: textSize,
            font: font,
            color: rgb(0.8, 0.8, 0.8), // Light Grey color (Professional)
            opacity: 0.4, // 40% transparent
            rotate: degrees(45), 
          });
        }

        // 2. APPLY PAGE NUMBERS
        if (addPageNumbers) {
          const pageText = `Page ${index + 1} of ${totalPages}`;
          const pageTextWidth = normalFont.widthOfTextAtSize(pageText, 12);
          
          page.drawText(pageText, {
            x: (width / 2) - (pageTextWidth / 2),
            y: 20, // Bottom se 20px upar
            size: 12,
            font: normalFont,
            color: rgb(0.3, 0.3, 0.3),
          });
        }
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edited-${file.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("PDF edited successfully!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Failed to edit PDF. The file might be encrypted.", { id: toastId });
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

      <div className="w-full max-w-sm mb-6 flex flex-col gap-5 bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        
        {/* Feature 1: Watermark */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <Type size={16} className="text-purple-500" /> Center Watermark Text
          </label>
          <input 
            type="text"
            value={watermarkText}
            onChange={(e) => setWatermarkText(e.target.value)}
            placeholder="e.g., APNA COLLEGE"
            className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
          />
        </div>

        <hr className="border-slate-200 dark:border-slate-700" />

        {/* Feature 2: Page Numbers */}
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-colors ${addPageNumbers ? 'bg-purple-500 border-purple-500' : 'border-slate-300 dark:border-slate-600 group-hover:border-purple-400'}`}>
            {addPageNumbers && <Hash size={14} className="text-white" />}
          </div>
          <input 
            type="checkbox" 
            className="hidden" 
            checked={addPageNumbers}
            onChange={(e) => setAddPageNumbers(e.target.checked)}
          />
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200 select-none">
            Add Page Numbers at Bottom
          </span>
        </label>
        
      </div>

      <button
        onClick={handleEdit}
        disabled={isEditing || (!watermarkText.trim() && !addPageNumbers)}
        className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all shadow-md ${
          isEditing || (!watermarkText.trim() && !addPageNumbers)
            ? 'bg-purple-400 cursor-not-allowed opacity-70'
            : 'bg-purple-600 hover:bg-purple-700 active:scale-95 hover:shadow-lg'
        }`}
      >
        {isEditing ? (
          <>
            <Loader2 className="animate-spin" size={20} /> Processing...
          </>
        ) : (
          <>
            <Download size={20} /> Apply Edits & Download
          </>
        )}
      </button>
    </motion.div>
  );
}
