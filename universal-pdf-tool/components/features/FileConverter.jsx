"use client";

import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Download, Loader2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function FileConverter({ files }) {
  const [isConverting, setIsConverting] = useState(false);
  const [targetFormat, setTargetFormat] = useState('');
  const [availableFormats, setAvailableFormats] = useState([]);

  // DYNAMIC DROPDOWN ENGINE: Har daily use file ke hisaab se options dikhayega
  useEffect(() => {
    if (files.length === 0) return;
    const file = files[0];
    const type = file.type;
    const name = file.name.toLowerCase();
    
    let formats = [];

    // 1. IMAGE Files
    if (type.startsWith('image/')) {
      formats = [
        { value: 'pdf', label: 'PDF Document (.pdf)' },
        { value: 'png', label: 'PNG Image (.png)' },
        { value: 'jpeg', label: 'JPG Image (.jpg)' },
        { value: 'doc', label: 'Word Document (.doc)' }
      ];
    } 
    // 2. TEXT Files
    else if (name.endsWith('.txt')) {
      formats = [
        { value: 'pdf', label: 'PDF Document (.pdf)' },
        { value: 'doc', label: 'Word Document (.doc)' },
        { value: 'json', label: 'JSON Data (.json)' }
      ];
    } 
    // 3. WORD Files
    else if (name.endsWith('.docx') || name.endsWith('.doc')) {
      formats = [
        { value: 'pdf', label: 'PDF Document (.pdf)' },
        { value: 'txt', label: 'Plain Text (.txt)' }
      ];
    } 
    // 4. PDF Files
    else if (name.endsWith('.pdf')) {
      formats = [
        { value: 'docx', label: 'Word Document (.docx)' },
        { value: 'txt', label: 'Plain Text (.txt)' },
        { value: 'jpeg', label: 'JPG Images (.jpg)' },
        { value: 'pptx', label: 'PowerPoint (.pptx)' }
      ];
    } 
    // 5. EXCEL Files
    else if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) {
      formats = [
        { value: 'pdf', label: 'PDF Document (.pdf)' },
        { value: 'json', label: 'JSON Data (.json)' },
        { value: 'csv', label: 'CSV File (.csv)' }
      ];
    } 
    // 6. PPT (PowerPoint) Files
    else if (name.endsWith('.pptx') || name.endsWith('.ppt')) {
      formats = [
        { value: 'pdf', label: 'PDF Document (.pdf)' },
        { value: 'txt', label: 'Extract Text (.txt)' }
      ];
    }
    // Fallback
    else {
      formats = [
        { value: 'txt', label: 'Convert to Text (.txt)' }
      ];
    }

    setAvailableFormats(formats);
    setTargetFormat(formats[0]?.value || '');
  }, [files]);

  // Helper function to auto-download generated files
  const triggerDownload = (blob, originalName, extension) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted-${originalName.split('.')[0]}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleConvert = async () => {
    if (files.length === 0 || !targetFormat) {
      toast.error("Invalid file or target format.");
      return;
    }

    const file = files[0];
    setIsConverting(true);
    const toastId = toast.loading(`Converting to ${targetFormat.toUpperCase()}...`);

    try {
      // 1. FAST NATIVE IMAGE CONVERSION IN BROWSER
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
                triggerDownload(blob, file.name, targetFormat === 'jpeg' ? 'jpg' : targetFormat);
                toast.success("Image converted locally!", { id: toastId });
              } else {
                toast.error("Image conversion failed.", { id: toastId });
              }
              setIsConverting(false);
            }, `image/${targetFormat}`, 1.0);
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
        return; 
      }

      // 2. TEXT TO MS WORD NATIVE CONVERSION
      if (targetFormat === 'doc' && file.name.toLowerCase().endsWith('.txt')) {
        const text = await file.text();
        const wordHtml = `
          <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
          <head><meta charset='utf-8'><title>Export to Word</title></head>
          <body>${text.replace(/\n/g, '<br>')}</body>
          </html>
        `;
        const blob = new Blob(['\ufeff', wordHtml], { type: 'application/msword' });
        triggerDownload(blob, file.name, 'doc');
        toast.success("Converted to Word format!", { id: toastId });
        setIsConverting(false);
        return;
      }

      // 3. SERVER-SIDE CONVERSIONS (Bhejna backend par)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('targetFormat', targetFormat);

      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Server failed to convert this heavy format natively without external APIs.");
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
      className="mt-6 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700"
    >
      <ArrowRightLeft className="text-blue-500 w-12 h-12 mb-4" />
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 truncate max-w-xs text-center">
        Universal Convert: {files[0]?.name}
      </h3>

      {availableFormats.length > 0 ? (
        <div className="w-full max-w-xs mb-6 flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <FileText size={16} /> Select Target Format:
          </label>
          <select 
            value={targetFormat}
            onChange={(e) => setTargetFormat(e.target.value)}
            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-darkCard text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary font-medium"
          >
            {availableFormats.map(fmt => (
              <option key={fmt.value} value={fmt.value}>{fmt.label}</option>
            ))}
          </select>
          <p className="text-xs text-emerald-500 text-center font-medium mt-1">
            Multiple native formats unlocked.
          </p>
        </div>
      ) : null}

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
