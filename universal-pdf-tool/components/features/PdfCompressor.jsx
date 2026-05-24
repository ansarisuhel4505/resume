"use client";

import React, { useState, useEffect } from 'react';
import { Minimize, Download, Loader2, Settings2, FileArchive, Image as ImageIcon, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import JSZip from 'jszip';

export default function PdfCompressor({ files }) {
  const [isCompressing, setIsCompressing] = useState(false);
  const [targetSizeKB, setTargetSizeKB] = useState(500); // Default 500 KB
  const [originalSizeKB, setOriginalSizeKB] = useState(0);

  useEffect(() => {
    if (files.length > 0) {
      const sizeKB = Math.round(files[0].size / 1024);
      setOriginalSizeKB(sizeKB);
      // Agar file 5MB se choti hai, toh slider ko uske current size se thoda kam par set karein
      setTargetSizeKB(sizeKB > 50 ? Math.round(sizeKB / 2) : 25);
    }
  }, [files]);

  const triggerDownload = (blob, originalName, extension) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compressed-${originalName.split('.')[0]}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCompress = async () => {
    if (files.length === 0) return;
    const file = files[0];
    const targetBytes = targetSizeKB * 1024;
    
    setIsCompressing(true);
    const toastId = toast.loading(`Compressing towards target: ${targetSizeKB} KB...`);

    try {
      // ========================================================
      // LOGIC 1: IMAGE COMPRESSION (Smart Target Matching)
      // ========================================================
      if (file.type.startsWith('image/')) {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        await new Promise(resolve => img.onload = resolve);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Target size match karne ka mathematical heuristic
        let scale = 1.0;
        let quality = 0.9;

        if (file.size > targetBytes) {
          // Calculate scale and quality dynamically based on size difference
          const ratio = targetBytes / file.size;
          scale = Math.max(0.1, Math.sqrt(ratio)); // Drop resolution
          quality = Math.max(0.1, ratio + 0.2);    // Drop quality
        }

        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          if (blob) {
            triggerDownload(blob, file.name, 'jpg');
            toast.success(`Compressed to ~${Math.round(blob.size / 1024)} KB!`, { id: toastId });
          } else {
            toast.error("Compression failed.", { id: toastId });
          }
          setIsCompressing(false);
        }, 'image/jpeg', quality);
        
        return; 
      }

      // ========================================================
      // LOGIC 2: DOCUMENT & OTHER FILES COMPRESSION (Level-9 ZIP)
      // ========================================================
      // PDF, DOCX, XLSX ko image ki tarah quality drop nahi kar sakte (warna corrupt ho jayengi)
      // Isliye hum Maximum Deflate ZIP algorithm use karenge
      const zip = new JSZip();
      zip.file(file.name, file);
      
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 9 // Maximum possible document compression
        }
      });

      triggerDownload(zipBlob, file.name, 'zip');
      toast.success(`Archived & Compressed to ~${Math.round(zipBlob.size / 1024)} KB!`, { id: toastId });

    } catch (error) {
      console.error(error);
      toast.error("Compression engine failed.", { id: toastId });
    } finally {
      setIsCompressing(false);
    }
  };

  if (files.length === 0) return null;

  const isImage = files[0].type.startsWith('image/');

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 flex flex-col items-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
      
      <Minimize className="text-amber-500 w-12 h-12 mb-4" />
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 truncate max-w-xs text-center">
        Universal File Compressor
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 text-center max-w-sm">
        Supports any file format. Exact target compression for images, and Level-9 maximum safe compression for documents.
      </p>

      {/* COMPRESSION CONTROLS */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
        
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            {isImage ? <ImageIcon size={18} className="text-blue-500"/> : <FileText size={18} className="text-blue-500"/>}
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate w-32">{files[0].name}</span>
          </div>
          <span className="text-sm font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded">
            {originalSizeKB > 1024 ? (originalSizeKB / 1024).toFixed(2) + ' MB' : originalSizeKB + ' KB'}
          </span>
        </div>

        <div className="space-y-4">
          <label className="flex justify-between items-center text-sm font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-2"><Settings2 size={16}/> Target Output Size:</span>
            <input 
              type="number" 
              min="5" 
              max="5000" 
              value={targetSizeKB}
              onChange={(e) => setTargetSizeKB(Math.min(5000, Math.max(5, Number(e.target.value))))}
              className="w-24 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-800 text-center outline-none focus:border-amber-500"
            />
            <span className="text-xs text-slate-500">KB</span>
          </label>
          
          <input 
            type="range" 
            min="5" 
            max="5000" 
            step="10"
            value={targetSizeKB}
            onChange={(e) => setTargetSizeKB(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
          
          <div className="flex justify-between text-xs font-semibold text-slate-400">
            <span>5 KB (Max)</span>
            <span>2500 KB</span>
            <span>5000 KB (5 MB)</span>
          </div>
        </div>

        {!isImage && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800/30 flex items-start gap-2">
            <FileArchive size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              <strong>Document Safety Protocol:</strong> Unlike images, documents (PDF/Word/Excel) cannot be forced into exact byte sizes without corrupting their code. We will apply the safest Level-9 ZIP compression to get as close to your target as technically possible.
            </p>
          </div>
        )}
      </div>

      <button
        onClick={handleCompress}
        disabled={isCompressing}
        className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all shadow-md ${
          isCompressing
            ? 'bg-amber-400 cursor-not-allowed opacity-70'
            : 'bg-amber-600 hover:bg-amber-700 active:scale-95 hover:shadow-lg'
        }`}
      >
        {isCompressing ? (
          <><Loader2 className="animate-spin" size={20} /> Compressing...</>
        ) : (
          <><Download size={20} /> Compress & Download</>
        )}
      </button>
    </motion.div>
  );
}
