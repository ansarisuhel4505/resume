"use client";

import React, { useState, useRef } from 'react';
import { Type, Table as TableIcon, Presentation, FileDown, Plus, Minus, Trash2, UploadCloud, Download, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import mammoth from 'mammoth';
import * as xlsx from 'xlsx';
import pptxgen from 'pptxgenjs';

// Dynamically loading Quill to avoid Next.js SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

export default function MicrosoftOfficeSuite() {
  const [activeTab, setActiveTab] = useState('word');
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState("My_Pro_Document");

  // ==========================================
  // 1. WORD EDITOR STATE & LOGIC
  // ==========================================
  const [wordHtml, setWordHtml] = useState("");
  const wordInputRef = useRef(null);

  const quillModules = {
    toolbar: [
      [{ 'font': [] }, { 'size': ['small', false, 'large', 'huge'] }],
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'header': 1 }, { 'header': 2 }, 'blockquote', 'code-block'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }, { 'align': [] }],
      ['link', 'image', 'video', 'formula'],
      ['clean']
    ]
  };

  const loadWordFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name.split('.')[0]);
    try {
      if (file.name.endsWith('.docx')) {
        const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
        setWordHtml(result.value);
        toast.success("Word file loaded!");
      }
    } catch (err) { toast.error("Failed to load DOCX"); }
  };

  const exportWord = () => {
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head><body>";
    const footer = "</body></html>";
    const blob = new Blob(['\ufeff', header + wordHtml + footer], { type: 'application/msword' });
    triggerDownload(blob, `${fileName}.doc`);
  };

  // ==========================================
  // 2. EXCEL GRID STATE & LOGIC (2D Array)
  // ==========================================
  const [excelGrid, setExcelGrid] = useState(Array.from({ length: 10 }, () => Array(5).fill("")));

  const updateExcelCell = (rowIndex, colIndex, value) => {
    const newGrid = [...excelGrid];
    newGrid[rowIndex][colIndex] = value;
    setExcelGrid(newGrid);
  };

  const addExcelRow = () => setExcelGrid([...excelGrid, Array(excelGrid[0].length).fill("")]);
  const removeExcelRow = () => excelGrid.length > 1 && setExcelGrid(excelGrid.slice(0, -1));
  
  const addExcelCol = () => setExcelGrid(excelGrid.map(row => [...row, ""]));
  const removeExcelCol = () => excelGrid[0].length > 1 && setExcelGrid(excelGrid.map(row => row.slice(0, -1)));

  const exportExcel = () => {
    const ws = xlsx.utils.aoa_to_sheet(excelGrid);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Sheet1");
    const buffer = xlsx.write(wb, { type: 'array', bookType: 'xlsx' });
    triggerDownload(new Blob([buffer]), `${fileName}.xlsx`);
  };

  // ==========================================
  // 3. PPT SLIDE MAKER STATE & LOGIC
  // ==========================================
  const [slides, setSlides] = useState([{ id: 1, title: "Click to edit title", content: "Click to edit text", bgColor: "#ffffff", titleColor: "#000000" }]);
  const [activeSlide, setActiveSlide] = useState(0);

  const addSlide = () => setSlides([...slides, { id: Date.now(), title: "New Slide", content: "Add your content here", bgColor: "#ffffff", titleColor: "#000000" }]);
  const deleteSlide = (index) => {
    if (slides.length > 1) {
      setSlides(slides.filter((_, i) => i !== index));
      setActiveSlide(0);
    }
  };

  const updateCurrentSlide = (field, value) => {
    const newSlides = [...slides];
    newSlides[activeSlide][field] = value;
    setSlides(newSlides);
  };

  const exportPpt = async () => {
    setIsProcessing(true);
    let pres = new pptxgen();
    slides.forEach(s => {
      let slide = pres.addSlide();
      slide.background = { fill: s.bgColor.replace('#', '') };
      slide.addText(s.title, { x: 0.5, y: 0.5, w: '90%', h: 1, fontSize: 32, bold: true, color: s.titleColor.replace('#', ''), align: pres.AlignH.center });
      slide.addText(s.content, { x: 0.5, y: 2, w: '90%', h: 3, fontSize: 18, color: s.titleColor.replace('#', ''), align: pres.AlignH.center, valign: pres.AlignV.top });
    });
    const buffer = await pres.write({ outputType: 'arraybuffer' });
    triggerDownload(new Blob([buffer]), `${fileName}.pptx`);
    setIsProcessing(false);
  };

  // ==========================================
  // UTILITY
  // ==========================================
  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filename} downloaded successfully!`);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-slate-900 rounded-2xl border shadow-xl flex flex-col h-[800px] overflow-hidden">
      
      {/* HEADER & TABS */}
      <div className="bg-slate-100 dark:bg-slate-800 border-b p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('word')} className={`px-4 py-2 rounded font-bold flex items-center gap-2 ${activeTab === 'word' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'}`}><Type size={18}/> Word</button>
          <button onClick={() => setActiveTab('excel')} className={`px-4 py-2 rounded font-bold flex items-center gap-2 ${activeTab === 'excel' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'}`}><TableIcon size={18}/> Excel</button>
          <button onClick={() => setActiveTab('ppt')} className={`px-4 py-2 rounded font-bold flex items-center gap-2 ${activeTab === 'ppt' ? 'bg-orange-600 text-white' : 'bg-white text-slate-700'}`}><Presentation size={18}/> PPT</button>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input type="text" value={fileName} onChange={e => setFileName(e.target.value)} className="px-3 py-2 border rounded outline-none font-semibold text-sm w-full sm:w-48" placeholder="File Name" />
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative bg-slate-50 dark:bg-slate-900">
        
        {/* ======================= WORD UI ======================= */}
        {activeTab === 'word' && (
          <div className="flex flex-col h-full">
            <div className="flex justify-between p-2 bg-white border-b">
              <div>
                <input type="file" accept=".docx" ref={wordInputRef} onChange={loadWordFile} className="hidden" />
                <button onClick={() => wordInputRef.current.click()} className="px-3 py-1 bg-slate-200 rounded text-sm font-bold flex items-center gap-2"><UploadCloud size={16}/> Load DOCX</button>
              </div>
              <button onClick={exportWord} className="px-4 py-1 bg-blue-600 text-white rounded text-sm font-bold flex items-center gap-2"><Download size={16}/> Save DOC</button>
            </div>
            <div className="flex-1 bg-white overflow-y-auto">
              <style jsx global>{`.ql-container { font-size: 16px; border: none !important; } .ql-toolbar { border: none !important; border-bottom: 1px solid #ccc !important; position: sticky; top: 0; z-index: 10; background: white; }`}</style>
              <ReactQuill theme="snow" value={wordHtml} onChange={setWordHtml} modules={quillModules} className="h-full pb-12" />
            </div>
          </div>
        )}

        {/* ======================= EXCEL UI ======================= */}
        {activeTab === 'excel' && (
          <div className="flex flex-col h-full p-4">
            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={addExcelRow} className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded text-sm font-bold flex items-center"><Plus size={14}/> Row</button>
              <button onClick={removeExcelRow} className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm font-bold flex items-center"><Minus size={14}/> Row</button>
              <button onClick={addExcelCol} className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded text-sm font-bold flex items-center ml-4"><Plus size={14}/> Col</button>
              <button onClick={removeExcelCol} className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm font-bold flex items-center"><Minus size={14}/> Col</button>
              <button onClick={exportExcel} className="ml-auto px-4 py-1 bg-emerald-600 text-white rounded text-sm font-bold flex items-center gap-2"><Download size={16}/> Save XLSX</button>
            </div>
            <div className="flex-1 overflow-auto bg-white border shadow-inner">
              <table className="border-collapse w-max min-w-full">
                <tbody>
                  {excelGrid.map((row, rIndex) => (
                    <tr key={rIndex}>
                      {row.map((cell, cIndex) => (
                        <td key={cIndex} className="border border-slate-300 p-0">
                          <input 
                            type="text" 
                            value={cell} 
                            onChange={(e) => updateExcelCell(rIndex, cIndex, e.target.value)}
                            className="w-32 h-8 px-2 outline-none focus:bg-blue-50 text-sm"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================= PPT UI ======================= */}
        {activeTab === 'ppt' && (
          <div className="flex h-full">
            {/* Slide Sidebar */}
            <div className="w-48 bg-slate-200 border-r overflow-y-auto p-2 flex flex-col gap-2">
              {slides.map((slide, index) => (
                <div key={slide.id} onClick={() => setActiveSlide(index)} className={`h-24 rounded border-2 cursor-pointer flex items-center justify-center text-xs font-bold p-2 text-center overflow-hidden ${activeSlide === index ? 'border-orange-500' : 'border-transparent'}`} style={{ backgroundColor: slide.bgColor, color: slide.titleColor }}>
                  {slide.title}
                </div>
              ))}
              <button onClick={addSlide} className="py-2 border-2 border-dashed border-slate-400 text-slate-500 font-bold rounded flex justify-center"><Plus size={20}/></button>
            </div>
            
            {/* Visual Slide Editor */}
            <div className="flex-1 p-6 flex flex-col">
              <div className="flex justify-between items-center mb-4 bg-white p-2 border rounded shadow-sm">
                <div className="flex gap-4 items-center">
                  <label className="text-sm font-bold flex items-center gap-1">BG: <input type="color" value={slides[activeSlide].bgColor} onChange={e => updateCurrentSlide('bgColor', e.target.value)} className="w-6 h-6 border-none cursor-pointer"/></label>
                  <label className="text-sm font-bold flex items-center gap-1">Text: <input type="color" value={slides[activeSlide].titleColor} onChange={e => updateCurrentSlide('titleColor', e.target.value)} className="w-6 h-6 border-none cursor-pointer"/></label>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => deleteSlide(activeSlide)} className="px-3 py-1 bg-red-100 text-red-600 rounded text-sm font-bold flex items-center"><Trash2 size={16}/> Delete Slide</button>
                  <button onClick={exportPpt} disabled={isProcessing} className="px-4 py-1 bg-orange-600 text-white rounded text-sm font-bold flex items-center gap-2"><Download size={16}/> Save PPTX</button>
                </div>
              </div>
              
              {/* Actual Slide Canvas */}
              <div className="flex-1 flex items-center justify-center bg-slate-100 border-2 border-slate-300 border-dashed rounded-xl overflow-hidden">
                <div className="w-full max-w-2xl aspect-video shadow-2xl flex flex-col items-center justify-center p-12 text-center" style={{ backgroundColor: slides[activeSlide].bgColor, color: slides[activeSlide].titleColor }}>
                  <input type="text" value={slides[activeSlide].title} onChange={e => updateCurrentSlide('title', e.target.value)} className="w-full text-4xl font-extrabold bg-transparent text-center outline-none border-b border-transparent focus:border-white/30 mb-4" />
                  <textarea value={slides[activeSlide].content} onChange={e => updateCurrentSlide('content', e.target.value)} className="w-full h-32 text-xl bg-transparent text-center outline-none resize-none border border-transparent focus:border-white/30" />
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </motion.div>
  );
}
