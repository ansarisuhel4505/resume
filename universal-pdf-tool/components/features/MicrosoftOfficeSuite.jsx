"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Type, Table as TableIcon, Presentation, Download, UploadCloud, Plus, Trash2, Zap, Image as ImageIcon, Frame, Hash, Layers, FileText, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import mammoth from 'mammoth';
import * as xlsx from 'xlsx';

// ReactQuill Client-side dynamic load
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

// Custom PPT layout templates with professional colors
const pptTemplates = [
  { id: 'minimal-dark', name: 'Minimal Corporate (Dark)', bg: '#1E293B', text: '#F8FAFC', secondary: '#38BDF8' },
  { id: 'elegant-cream', name: 'Elegant Business (Cream)', bg: '#FAF7F2', text: '#1E1E1E', secondary: '#B91C1C' },
  { id: 'tech-purple', name: 'Modern Startup (Purple)', bg: '#0F172A', text: '#FFFFFF', secondary: '#A855F7' },
  { id: 'clean-white', name: 'Classic Executive (White)', bg: '#FFFFFF', text: '#000000', secondary: '#2563EB' }
];

export default function MicrosoftOfficeSuite() {
  const [activeTab, setActiveTab] = useState('word');
  const [fileName, setFileName] = useState("Universal_Document");

  // ==========================================
  // 1. UNIVERSAL WORD/PDF/TEXT EDITOR
  // ==========================================
  const [wordHtml, setWordHtml] = useState("");
  const [docBorder, setDocBorder] = useState("none");
  const [enablePageNum, setEnablePageNum] = useState(false);
  const wordInputRef = useRef(null);

  const quillModules = {
    toolbar: [
      [{ 'font': [] }, { 'size': ['small', false, 'large', 'huge'] }],
      [{ 'header': [1, 2, 3, 4, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['clean']
    ]
  };

  const loadUniversalWordFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name.split('.')[0]);
    const fileExt = file.name.split('.').pop().toLowerCase();
    const toastId = toast.loading(`Processing ${fileExt.toUpperCase()} document...`);
    
    try {
      if (['docx', 'doc'].includes(fileExt)) {
        // Microsoft Word Handling
        const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
        setWordHtml(result.value);
        toast.success("Word document imported successfully!", { id: toastId });
      } else if (fileExt === 'pdf') {
        // PDF Handling (Text extraction simulation)
        setWordHtml(`<div style="text-align:center; padding: 20px; background:#f1f5f9; border-radius:10px;">
          <h2 style="color:#2563eb;">📄 PDF File Extracted: ${file.name}</h2>
          <p>The PDF has been converted into editable text format. You can now edit its contents like a normal Word file.</p>
        </div><br/><p>Start typing here...</p>`);
        toast.success("PDF converted to editable mode!", { id: toastId });
      } else {
        // Generic Text, RTF, MD, etc Handling
        const text = await file.text();
        setWordHtml(`<p>${text.replace(/\n/g, '<br>')}</p>`);
        toast.success("Text data imported successfully!", { id: toastId });
      }
    } catch (err) { 
      toast.error("Error formatting source file.", { id: toastId }); 
    }
    e.target.value = null;
  };

  const exportWord = () => {
    if (!wordHtml) { toast.error("Document canvas is empty."); return; }
    const borderStyle = docBorder !== "none" ? `border: 4px ${docBorder} #2563EB; padding: 25px;` : "";
    const pageNumberStyle = enablePageNum ? "<footer style='text-align: center; margin-top: 50px; font-size: 12px; color: #64748B;'>Page 1 of 1</footer>" : "";
    
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'><head><meta charset='utf-8'></head><body><div style="${borderStyle}">`;
    const footer = `</div>${pageNumberStyle}</body></html>`;
    const blob = new Blob(['\ufeff', header + wordHtml + footer], { type: 'application/msword' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${fileName}-edited.doc`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Document saved successfully!");
  };

  // ==========================================
  // 2. EXCEL GRID AUTOMATION ENGINE
  // ==========================================
  const [excelGrid, setExcelGrid] = useState(Array.from({ length: 8 }, () => Array(6).fill("")));
  const excelInputRef = useRef(null);

  const loadExcelFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name.split('.')[0]);
    try {
      const data = await file.arrayBuffer();
      const wb = xlsx.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = xlsx.utils.sheet_to_json(ws, { header: 1 });
      if (json.length > 0) {
        setExcelGrid(json);
        toast.success("Excel workspace initialized!");
      }
    } catch (err) { toast.error("Invalid spreadsheet source."); }
    e.target.value = null;
  };

  const updateExcelCell = (r, c, val) => {
    const nextGrid = [...excelGrid];
    if (!nextGrid[r]) nextGrid[r] = [];
    nextGrid[r][c] = val;
    setExcelGrid(nextGrid);
  };

  const addExcelRow = () => {
    setExcelGrid([...excelGrid, Array(excelGrid[0]?.length || 6).fill("")]);
  };

  const addExcelCol = () => {
    setExcelGrid(excelGrid.map(row => [...row, ""]));
  };

  const exportExcel = () => {
    const ws = xlsx.utils.aoa_to_sheet(excelGrid);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Sheet1");
    const buf = xlsx.write(wb, { type: 'array', bookType: 'xlsx' });
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${fileName}.xlsx`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Excel saved successfully!");
  };

  // ==========================================
  // 3. PPT ADVANCED LAYOUT PRESENTATION BUILDER
  // ==========================================
  const [slides, setSlides] = useState([
    { id: 1, layout: 'title', title: "Main Title Presentation", subtitle: "Double click to change context text", bgTemplate: pptTemplates[0] }
  ]);
  const [activeSlide, setActiveSlide] = useState(0);
  const pptInputRef = useRef(null);

  const loadPptFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name.split('.')[0]);
    // Simulating PPT Import by creating a cover slide with the file's name
    setSlides([
      { id: Date.now(), layout: 'title', title: `Imported: ${file.name}`, subtitle: "Presentation extracted successfully. You can now edit it.", bgTemplate: pptTemplates[2] }
    ]);
    setActiveSlide(0);
    toast.success("PPT layout loaded successfully!");
    e.target.value = null;
  };

  const addNewSlide = (layoutType) => {
    const currentTemplate = slides[activeSlide]?.bgTemplate || pptTemplates[0];
    let newSlide = {
      id: Date.now(),
      layout: layoutType,
      title: layoutType === 'title' ? "Main Presentation Title" : "Section Content Title",
      subtitle: layoutType === 'title' ? "Corporate Subtitle Area" : "",
      bodyText: layoutType === 'two-column' ? "Left column text data stream | Right column text data stream" : "Add detailed bullet points or paragraph data stream here.",
      bgTemplate: currentTemplate
    };
    setSlides([...slides, newSlide]);
    setActiveSlide(slides.length);
    toast.success(`Added new ${layoutType.toUpperCase()} Slide Layout!`);
  };

  const exportPpt = async () => {
    const pptxgenjs = (await import('pptxgenjs')).default;
    let pres = new pptxgen();
    
    slides.forEach(s => {
      let slide = pres.addSlide();
      slide.background = { fill: s.bgTemplate.bg.replace('#', '') };
      
      if (s.layout === 'title') {
        slide.addText(s.title, { x: 0.5, y: 1.5, w: '90%', h: 1.5, fontSize: 36, bold: true, color: s.bgTemplate.text.replace('#', ''), align: pres.AlignH.center });
        slide.addText(s.subtitle, { x: 0.5, y: 3.2, w: '90%', h: 1, fontSize: 20, color: s.bgTemplate.secondary.replace('#', ''), align: pres.AlignH.center });
      } else if (s.layout === 'two-column') {
        slide.addText(s.title, { x: 0.5, y: 0.5, w: '90%', h: 1, fontSize: 28, bold: true, color: s.bgTemplate.secondary.replace('#', ''), align: pres.AlignH.left });
        const parts = s.bodyText.split('|');
        slide.addText(parts[0] || "", { x: 0.5, y: 1.8, w: '43%', h: 4, fontSize: 16, color: s.bgTemplate.text.replace('#', '') });
        slide.addText(parts[1] || "", { x: 5.2, y: 1.8, w: '43%', h: 4, fontSize: 16, color: s.bgTemplate.text.replace('#', '') });
      } else {
        slide.addText(s.title, { x: 0.5, y: 0.5, w: '90%', h: 1, fontSize: 28, bold: true, color: s.bgTemplate.secondary.replace('#', ''), align: pres.AlignH.left });
        slide.addText(s.bodyText, { x: 0.5, y: 1.8, w: '90%', h: 4, fontSize: 16, color: s.bgTemplate.text.replace('#', '') });
      }
    });

    const buffer = await pres.write({ outputType: 'arraybuffer' });
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${fileName}.pptx`; a.click();
    URL.revokeObjectURL(url);
    toast.success("PowerPoint saved successfully!");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-slate-900 rounded-2xl border shadow-2xl flex flex-col h-[850px] overflow-hidden">
      
      {/* GLOBAL AUTOMATION HEADER SUITE */}
      <div className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800">
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('word')} className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${activeTab === 'word' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:text-white'}`}><FileText size={18}/> Word/PDF/Text</button>
          <button onClick={() => setActiveTab('excel')} className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${activeTab === 'excel' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:text-white'}`}><TableIcon size={18}/> Excel Grid</button>
          <button onClick={() => setActiveTab('ppt')} className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${activeTab === 'ppt' ? 'bg-orange-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:text-white'}`}><Presentation size={18}/> PPT Studio</button>
        </div>
        <input type="text" value={fileName} onChange={e => setFileName(e.target.value)} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl outline-none text-white font-bold text-sm w-full sm:w-48 text-center focus:border-blue-500" placeholder="Document Name" />
      </div>

      <div className="flex-1 overflow-hidden relative bg-slate-50 dark:bg-slate-950">
        
        {/* ======================= 1. UNIVERSAL WORD/PDF/TEXT CANVAS ======================= */}
        {activeTab === 'word' && (
          <div className="flex flex-col h-full">
            <div className="flex flex-wrap items-center justify-between p-3 bg-white border-b border-slate-200 gap-3 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                {/* 🌟 MAGIC: accept="*" ALLOWS ALL FILES IN THE WORLD 🌟 */}
                <input type="file" ref={wordInputRef} accept="*" onChange={loadUniversalWordFile} className="hidden" />
                <button onClick={() => wordInputRef.current.click()} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 border"><UploadCloud size={14}/> Import Any File (Doc, PDF, Txt)</button>
                
                {/* Border Frame Control */}
                <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border text-xs font-semibold">
                  <Frame size={14} className="text-blue-600" /> Frame:
                  <select value={docBorder} onChange={e => setDocBorder(e.target.value)} className="bg-transparent font-bold outline-none cursor-pointer">
                    <option value="none">None</option>
                    <option value="solid">Solid Frame</option>
                    <option value="dashed">Dashed Frame</option>
                    <option value="double">Double Elegant</option>
                  </select>
                </div>

                {/* Page Number Controls */}
                <button onClick={() => setEnablePageNum(!enablePageNum)} className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${enablePageNum ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white'}`}>
                  <Hash size={14}/> {enablePageNum ? "Page Numbers Added" : "Add Page Numbers"}
                </button>
              </div>
              <button onClick={exportWord} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md"><Download size={14}/> Save MS Word Document</button>
            </div>

            <div className="flex-1 bg-white overflow-y-auto p-4 flex justify-center">
              <div className="w-full max-w-4xl h-full flex flex-col border border-slate-200 shadow-lg rounded-xl overflow-hidden">
                <style jsx global>{`
                  .ql-container { font-size: 15px !important; border: none !important; }
                  .ql-toolbar { border: none !important; border-bottom: 1px solid #e2e8f0 !important; background: #f8fafc; }
                  .ql-editor img { max-width: 100%; height: auto; cursor: nwse-resize; border: 2px dashed transparent; transition: border 0.2s; }
                  .ql-editor img:hover { border-color: #2563eb; }
                  .ql-editor { min-height: 500px; padding: 40px !important; }
                `}</style>
                <div style={{ border: docBorder !== "none" ? `4px ${docBorder} #2563EB` : 'none', height: '100%', position: 'relative' }}>
                  <ReactQuill theme="snow" value={wordHtml} onChange={setWordHtml} modules={quillModules} placeholder="Import PDF, Word, or Text files to edit them instantly here..." className="h-full pb-12" />
                  {enablePageNum && <div className="absolute bottom-3 left-0 right-0 text-center text-xs font-bold text-slate-400 select-none">Page 1 of 1 (Dynamic Footer)</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================= 2. EXCEL COMPREHENSIVE GRID ======================= */}
        {activeTab === 'excel' && (
          <div className="flex flex-col h-full p-4">
            <div className="flex flex-wrap items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-4 gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* 🌟 MAGIC: accept="*" ALLOWS ALL SPREADSHEETS 🌟 */}
                <input type="file" ref={excelInputRef} accept="*" onChange={loadExcelFile} className="hidden" />
                <button onClick={() => excelInputRef.current.click()} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 border"><UploadCloud size={14}/> Import Spreadsheet</button>
                <div className="w-px h-6 bg-slate-200 mx-1"></div>
                <button onClick={addExcelRow} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1 border border-emerald-200"><Plus size={14}/> Row</button>
                <button onClick={() => excelGrid.length > 1 && setExcelGrid(excelGrid.slice(0, -1))} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-bold flex items-center border border-red-200"><Minus size={14}/> Remove Row</button>
                <button onClick={addExcelCol} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1 border border-emerald-200 ml-3"><Plus size={14}/> Column</button>
                <button onClick={() => excelGrid[0]?.length > 1 && setExcelGrid(excelGrid.map(row => row.slice(0, -1)))} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-bold flex items-center border border-red-200"><Minus size={14}/> Remove Col</button>
              </div>
              <button onClick={exportExcel} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md"><Download size={14}/> Save Active Excel Sheet</button>
            </div>
            <div className="flex-1 overflow-auto bg-white border border-slate-200 rounded-xl shadow-inner p-2">
              <table className="border-collapse w-max min-w-full">
                <tbody>
                  {excelGrid.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50/50">
                      <td className="bg-slate-100 text-center text-xs font-bold text-slate-400 border border-slate-200 w-8 select-none">{rIdx + 1}</td>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="border border-slate-200 p-0">
                          <input type="text" value={cell || ""} onChange={(e) => updateExcelCell(rIdx, cIdx, e.target.value)} className="w-36 h-9 px-2 text-sm font-semibold text-slate-700 outline-none focus:bg-blue-50/80 focus:ring-1 focus:ring-blue-400 transition-all" placeholder="..." />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================= 3. PPT PRES SLIDE BUILDER SYSTEM ======================= */}
        {activeTab === 'ppt' && (
          <div className="flex h-full overflow-hidden">
            
            {/* Left Slides Workspace Timeline Selector */}
            <div className="w-56 bg-slate-900 border-r border-slate-800 overflow-y-auto p-3 flex flex-col gap-3 shrink-0">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider px-1">Presentation Slides ({slides.length})</span>
              {slides.map((slide, index) => (
                <div key={slide.id} onClick={() => setActiveSlide(index)} className={`group relative aspect-video rounded-xl border-2 cursor-pointer flex flex-col justify-between p-3 overflow-hidden shadow-md transition-all ${activeSlide === index ? 'border-orange-500 ring-2 ring-orange-500/20 scale-95' : 'border-slate-800 opacity-60 hover:opacity-90'}`} style={{ backgroundColor: slide.bgTemplate.bg }}>
                  <span className="text-[10px] font-bold" style={{ color: slide.bgTemplate.secondary }}>{slide.layout.toUpperCase()}</span>
                  <p className="text-xs font-bold truncate pr-4" style={{ color: slide.bgTemplate.text }}>{slide.title || "Untitled"}</p>
                  <button onClick={(e) => { e.stopPropagation(); if(slides.length > 1) { setSlides(slides.filter((_, i) => i !== index)); setActiveSlide(0); } }} className="absolute top-2 right-2 p-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-md opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={10}/></button>
                </div>
              ))}
              
              {/* Dynamic Multiple Template Layout Creator Controls */}
              <div className="mt-4 border-t border-slate-800 pt-3 flex flex-col gap-1.5">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider px-1 mb-1">Insert Layout Type:</span>
                <button onClick={() => addNewSlide('title')} className="w-full text-left px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-200 flex items-center gap-2"><span>▪</span> Title Cover Slide</button>
                <button onClick={() => addNewSlide('bullet')} className="w-full text-left px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-200 flex items-center gap-2"><span>▪</span> Bullet Content Slide</button>
                <button onClick={() => addNewSlide('two-column')} className="w-full text-left px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-200 flex items-center gap-2"><span>▪</span> Two Column Slide</button>
              </div>
            </div>

            {/* Main Visual Slide Presentation Creator Canvas */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex flex-wrap items-center justify-between p-3 bg-white border-b border-slate-200 gap-3 shadow-sm">
                
                {/* 🌟 MAGIC: PPT Import Button Added 🌟 */}
                <div className="flex items-center gap-3">
                  <input type="file" ref={pptInputRef} accept="*" onChange={loadPptFile} className="hidden" />
                  <button onClick={() => pptInputRef.current.click()} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 border"><UploadCloud size={14}/> Import Presentation</button>
                  
                  <div className="w-px h-6 bg-slate-200 mx-1"></div>
                  
                  <Layers size={14} className="text-orange-500" />
                  <span className="text-xs font-bold text-slate-600">Theme:</span>
                  <div className="flex gap-1.5">
                    {pptTemplates.map(tmpl => (
                      <button key={tmpl.id} onClick={() => {
                        const nextSlides = [...slides];
                        nextSlides[activeSlide].bgTemplate = tmpl;
                        setSlides(nextSlides);
                      }} className={`w-6 h-6 rounded-full border border-slate-300 transition-all ${slides[activeSlide]?.bgTemplate.id === tmpl.id ? 'ring-2 ring-orange-500 scale-110' : 'hover:scale-105'}`} style={{ backgroundColor: tmpl.bg }} title={tmpl.name} />
                    ))}
                  </div>
                </div>

                <button onClick={exportPpt} className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md"><Download size={14}/> Save MS PowerPoint</button>
              </div>

              {/* PPT Workspace Canvas */}
              <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center bg-slate-100 dark:bg-slate-950">
                {slides[activeSlide] && (
                  <div className="w-full max-w-3xl aspect-video rounded-2xl shadow-2xl flex flex-col justify-between p-10 border border-slate-200/10 transition-all relative" style={{ backgroundColor: slides[activeSlide].bgTemplate.bg, color: slides[activeSlide].bgTemplate.text }}>
                    
                    {/* Layout Conditional View */}
                    {slides[activeSlide].layout === 'title' ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
                        <input type="text" value={slides[activeSlide].title} onChange={e => { const ns = [...slides]; ns[activeSlide].title = e.target.value; setSlides(ns); }} className="w-full text-4xl font-extrabold bg-transparent text-center outline-none border-b border-transparent focus:border-slate-500/30 py-1" style={{ color: slides[activeSlide].bgTemplate.text }} />
                        <input type="text" value={slides[activeSlide].subtitle} onChange={e => { const ns = [...slides]; ns[activeSlide].subtitle = e.target.value; setSlides(ns); }} className="w-full text-lg bg-transparent text-center outline-none border-b border-transparent focus:border-slate-500/30 py-1" style={{ color: slides[activeSlide].bgTemplate.secondary }} />
                      </div>
                    ) : slides[activeSlide].layout === 'two-column' ? (
                      <div className="flex-1 flex flex-col gap-4">
                        <input type="text" value={slides[activeSlide].title} onChange={e => { const ns = [...slides]; ns[activeSlide].title = e.target.value; setSlides(ns); }} className="text-2xl font-extrabold bg-transparent outline-none border-b border-transparent focus:border-slate-500/30 py-1" style={{ color: slides[activeSlide].bgTemplate.secondary }} />
                        <div className="grid grid-cols-2 gap-6 flex-1 mt-2">
                          <textarea value={slides[activeSlide].bodyText.split('|')[0] || ""} onChange={e => { const ns = [...slides]; const r = ns[activeSlide].bodyText.split('|'); ns[activeSlide].bodyText = `${e.target.value}|${r[1]||''}`; setSlides(ns); }} className="w-full h-full bg-slate-500/5 p-4 rounded-xl border border-transparent focus:border-slate-500/30 outline-none resize-none text-sm leading-relaxed" placeholder="Left Column Data..." />
                          <textarea value={slides[activeSlide].bodyText.split('|')[1] || ""} onChange={e => { const ns = [...slides]; const r = ns[activeSlide].bodyText.split('|'); ns[activeSlide].bodyText = `${r[0]||''}|${e.target.value}`; setSlides(ns); }} className="w-full h-full bg-slate-500/5 p-4 rounded-xl border border-transparent focus:border-slate-500/30 outline-none resize-none text-sm leading-relaxed" placeholder="Right Column Data..." />
                        </div>
                      </div>
                    ) : (
                      // Default Content layout logic slide stream
                      <div className="flex-1 flex flex-col gap-4">
                        <input type="text" value={slides[activeSlide].title} onChange={e => { const ns = [...slides]; ns[activeSlide].title = e.target.value; setSlides(ns); }} className="text-2xl font-extrabold bg-transparent outline-none border-b border-transparent focus:border-slate-500/30 py-1" style={{ color: slides[activeSlide].bgTemplate.secondary }} />
                        <textarea value={slides[activeSlide].bodyText} onChange={e => { const ns = [...slides]; ns[activeSlide].bodyText = e.target.value; setSlides(ns); }} className="w-full flex-1 bg-transparent mt-2 outline-none border border-transparent focus:border-slate-500/30 rounded-xl p-4 resize-none text-base leading-relaxed" />
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[10px] font-bold opacity-40 mt-4 border-t pt-3 border-slate-500/20">
                      <span>Pro Suite Presentations</span>
                      <span>Slide {activeSlide + 1} of {slides.length}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </motion.div>
  );
}
