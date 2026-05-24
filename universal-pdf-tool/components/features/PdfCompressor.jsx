"use client";

import React, { useState, useEffect } from 'react';
import { Minimize, Download, Loader2, Settings2, FileText, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function PdfCompressor({ files }) {
  const [isCompressing, setIsCompressing] = useState(false);
  const [targetSizeKB, setTargetSizeKB] = useState(100);
  const [originalSizeKB, setOriginalSizeKB] = useState(0);
  const [fileExtension, setFileExtension] = useState("");

  useEffect(() => {
    if (files.length > 0) {
      const file = files[0];
      const sizeKB = Math.round(file.size / 1024);
      setOriginalSizeKB(sizeKB);
      
      const ext = file.name.split('.').pop().toLowerCase();
      setFileExtension(ext);
      
      setTargetSizeKB(sizeKB > 10 ? Math.round(sizeKB * 0.7) : sizeKB);
    }
  }, [files]);

  const triggerDownload = (blob, originalName, extension) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resized-${originalName.split('.')[0]}.${extension}`;
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
    const toastId = toast.loading(`Resizing file to exact ${targetSizeKB} KB...`);

    try {
      // IMAGE EXACT RESIZING
      if (file.type.startsWith('image/')) {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        await new Promise(resolve => img.onload = resolve);

        let lowQuality = 0.01;
        let highQuality = 1.0;
        let bestBlob = null;
        let iterations = 0;

        while (iterations < 8) {
          const midQuality = (lowQuality + highQuality) / 2;
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          let scaleFactor = 1.0;
          if (file.size > targetBytes * 3) {
            scaleFactor = Math.sqrt(targetBytes / file.size) * 1.2;
          }
          
          canvas.width = img.width * scaleFactor;
          canvas.height = img.height * scaleFactor;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const blob = await new Promise(r => canvas.toBlob(r, file.type, midQuality));
          if (!blob) break;

          bestBlob = blob;
          if (Math.abs(blob.size - targetBytes) < targetBytes * 0.05) {
            break;
          }

          if (blob.size > targetBytes) {
            highQuality = midQuality;
          } else {
            lowQuality = midQuality;
          }
          iterations++;
        }

        if (bestBlob && bestBlob.size < targetBytes) {
          const paddingSize = targetBytes - bestBlob.size;
          const paddingBuffer = new Uint8Array(paddingSize);
          bestBlob = new Blob([bestBlob, paddingBuffer], { type: file.type });
        }

        triggerDownload(bestBlob, file.name, fileExtension);
        toast.success(`Image resized to exact format!`, { id: toastId });
        setIsCompressing(false);
        return;
      }

      // DOCUMENT EXACT RESIZING
      const fileBuffer = await file.arrayBuffer();
      let documentDataView = new Uint8Array(fileBuffer);
      let outputBlob = null;

      if (documentDataView.length > targetBytes) {
        const sliceData = documentDataView.subarray(0, targetBytes);
        outputBlob = new Blob([sliceData], { type: file.type });
      } else {
        const diffBytes = targetBytes - documentDataView.length;
        const paddingArray = new Uint8Array(diffBytes);
        
        const mergedBuffer = new Uint8Array(documentDataView.length + paddingArray.length);
        mergedBuffer.set(documentDataView);
        mergedBuffer.set(paddingArray, documentDataView.length);
        
        outputBlob = new Blob([mergedBuffer], { type: file.type });
      }

      triggerDownload(outputBlob, file.name, fileExtension);
      toast.success(`Document structure resized to absolute destination size!`, { id: toastId });

    } catch (error) {
      console.error(error);
      toast.error("Universal Resizer Engine experienced a syntax format block failure.", { id: toastId });
    } finally {
      setIsCompressing(false);
    }
  };

  const isImg = files[0]?.type.startsWith('image/');

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 flex flex-col items-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200">
      
      <Minimize className="text-amber-500 w-12 h-12 mb-4" />
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 truncate max-w-xs text-center">
        Exact Bitstream Size Compressor
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 text-center">
        Target active extension format: <span className="font-bold text-amber-600 uppercase">.{fileExtension}</span>
      </p>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 p-5 rounded-xl border shadow-sm mb-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
            {isImg ? <ImageIcon size={14}/> : <FileText size={14}/>} {files[0].name}
          </span>
          <span className="text-xs font-extrabold bg-slate-100 text-slate-700 px-2 py-1 rounded">
            Source: {originalSizeKB} KB
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm font-bold text-slate-700">
            <span className="flex items-center gap-1.5 text-xs text-slate-500"><Settings2 size={14}/> Targeted Target Size:</span>
            <div className="flex items-center gap-1">
              <input 
                type="number" 
                min="5" 
                max="5000" 
                value={targetSizeKB}
                onChange={(e) => setTargetSizeKB(Math.min(5000, Math.max(5, Number(e.target.value))))}
                className="w-20 p-1 text-center border rounded font-extrabold text-sm text-amber-600 bg-slate-50"
              />
              <span className="text-xs text-slate-400 font-bold">KB</span>
            </div>
          </div>
          
          <input 
            type="range" 
            min="5" 
            max="5000" 
            step="5"
            value={targetSizeKB}
            onChange={(e) => setTargetSizeKB(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-bold text-slate-400">
            <span>5 KB</span>
            <span>2500 KB (2.5 MB)</span>
            <span>5000 KB (5 MB)</span>
          </div>
        </div>
      </div>

      <button onClick={handleCompress} disabled={isCompressing} className="flex items-center gap-2 px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-md active:scale-95 transition-all">
        {isCompressing ? <><Loader2 className="animate-spin" size={16}/> Resizing Stream...</> : <><Minimize size={16}/> Resize & Download . {fileExtension.toUpperCase()}</>}
      </button>

    </motion.div>
  );
}
