"use client";

import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Download, Loader2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function FileConverter({ files }) {
  const [isConverting, setIsConverting] = useState(false);
  const [targetFormat, setTargetFormat] = useState('');
  const [availableFormats, setAvailableFormats] = useState([]);

  // SAARE OPTIONS KA MATRIX: Kisi bhi file par saare options samne aayenge
  useEffect(() => {
    if (files.length === 0) return;
    const file = files[0];
    const type = file.type;
    const name = file.name.toLowerCase();
    
    let formats = [];

    if (type.startsWith('image/')) {
      formats = [
        { value: 'pdf', label: 'PDF Document (.pdf)' },
        { value: 'png', label: 'PNG Image (.png)' },
        { value: 'jpeg', label: 'JPG Image (.jpg)' },
        { value: 'webp', label: 'WEBP Image (.webp)' },
        { value: 'docx', label: 'Word Document (.docx)' }
      ];
    } else if (name.endsWith('.txt')) {
      formats = [
        { value: 'pdf', label: 'PDF Document (.pdf)' },
        { value: 'docx', label: 'Word Document (.docx)' },
        { value: 'xlsx', label: 'Excel Sheet (.xlsx)' },
        { value: 'csv', label: 'CSV Format (.csv)' },
        { value: 'json', label: 'JSON Structure (.json)' }
      ];
    } else if (name.endsWith('.docx') || name.endsWith('.doc')) {
      formats = [
        { value: 'pdf', label: 'PDF Document (.pdf)' },
        { value: 'txt', label: 'Plain Text (.txt)' },
        { value: 'json', label: 'JSON Hierarchy (.json)' }
      ];
    } else if (name.endsWith('.pdf')) {
      formats = [
        { value: 'docx', label: 'Word Document (.docx)' },
        { value: 'txt', label: 'Plain Text (.txt)' },
        { value: 'json', label: 'JSON Structural Data (.json)' }
      ];
    } else if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) {
      formats = [
        { value: 'pdf', label: 'PDF Table Document (.pdf)' },
        { value: 'json', label: 'JSON Dataset (.json)' },
        { value: 'csv', label: 'CSV Comma Separated (.csv)' },
        { value: 'xlsx', label: 'Excel Workbook (.xlsx)' },
        { value: 'txt', label: 'Tab Delimited Text (.txt)' }
      ];
    } else if (name.endsWith('.pptx') || name.endsWith('.ppt')) {
      formats = [
        { value: 'pdf', label: 'PDF Presentation (.pdf)' },
        { value: 'txt', label: 'Plain Text Outline (.txt)' }
      ];
    } else {
      // Global Fallback matrix options
      formats = [
        { value: 'pdf', label: 'PDF Document (.pdf)' },
        { value: 'txt', label: 'Plain Text (.txt)' },
        { value: 'docx', label: 'Word Document (.docx)' }
      ];
    }

    setAvailableFormats(formats);
    setTargetFormat(formats[0]?.value || '');
  }, [files]);

  const triggerDownload = (blob, originalName, extension) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `universal-converted-${originalName.split('.')[0]}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleConvert = async () => {
    if (files.length === 0 || !targetFormat) {
      toast.error("Invalid file selection.");
      return;
    }

    const file = files[0];
    setIsConverting(true);
    const toastId = toast.loading(`Universal Engine converting to ${targetFormat.toUpperCase()}...`);

    try {
      // Client-side instant conversion fallback for speed (Images to Images)
      if (file.type.startsWith('image/') && ['png', 'jpeg', 'webp'].includes(targetFormat)) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            canvas.toBlob((blob) => {
              if (blob) {
                triggerDownload(blob, file.name, targetFormat);
                toast.success("Conversion successful!", { id: toastId });
              } else {
                toast.error("Local render failed.", { id: toastId });
              }
              setIsConverting(false);
            }, `image/${targetFormat}`, 1.0);
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
        return; 
      }

      // Baaki saari files Direct Backend Engine sambhalega
      const formData = new FormData();
      formData.append('file', file);
      formData.append('targetFormat', targetFormat);

      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Server Native Engine error.");
      }

      let blob;
      if (targetFormat === 'json') {
        const data = await response.json();
        blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      } else {
        blob = await response.blob();
      }
      
      triggerDownload(blob, file.name, targetFormat);
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
      className="w-full mt-6 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700"
    >
      <ArrowRightLeft className="text-blue-500 w-12 h-12 mb-4" />
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 truncate max-w-xs text-center">
        Universal Conversion Matrix
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 text-center">
        Active File: <span className="font-semibold text-primary">{files[0]?.name}</span>
      </p>

      {availableFormats.length > 0 && (
        <div className="w-full max-w-xs mb-6 flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <FileText size={16} /> Target Output Format:
          </label>
          <select 
            value={targetFormat}
            onChange={(e) => setTargetFormat(e.target.value)}
            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-darkCard text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary font-semibold"
          >
            {availableFormats.map(fmt => (
              <option key={fmt.value} value={fmt.value}>{fmt.label}</option>
            ))}
          </select>
        </div>
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
            <Loader2 className="animate-spin" size={20} /> Processing Stream...
          </>
        ) : (
          <>
            <Download size={20} /> Convert & Download Now
          </>
        )}
      </button>
    </motion.div>
  );
}
