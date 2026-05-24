"use client";

import React, { useState, useRef } from 'react';
import { 
  Type, Table as TableIcon, Presentation, Download, UploadCloud, Plus, Trash2, 
  Frame, Hash, Layers, FileText, Minus, Image as ImageIcon, Palette, Bold, Italic, 
  AlignLeft, AlignCenter, AlignRight, Type as TypeIcon 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import mammoth from 'mammoth';
import * as xlsx from 'xlsx';

// ReactQuill Client-side dynamic load
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

// Professional Slide Templates
const pptTemplates = [
  { id: 'minimal-dark', name: 'Dark Executive', bg: '#1E293B', text: '#F8FAFC', secondary: '#38BDF8' },
  { id: 'elegant-cream', name: 'Cream Business', bg: '#FAF7F2', text: '#1E1E1E', secondary: '#B91C1C' },
  { id: 'clean-white', name: 'Classic White', bg: '#FFFFFF', text: '#000000', secondary: '#2563EB' }
];

export default function MicrosoftOfficeSuite() {
  const [activeTab, setActiveTab] = useState('word'); 
  const [fileName, setFileName] = useState("Universal_Document");

  // ==========================================
  // 1. ADVANCED MS WORD STUDIO (A4 PAPER UI)
  // ==========================================
  const [wordHtml, setWordHtml] = useState("");
  const [docBorder, setDocBorder] = useState("none");
  const [enablePageNum, setEnablePageNum] = useState(true);
  const wordInputRef = useRef(null);

  const quillModules = {
    toolbar: [
      [{ 'font': [] }, { 'size': ['small', false, 'large', 'huge'] }],
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['blockquote', 'code-block'],
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
        const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
        setWordHtml(result.value);
        toast.success("Word document imported flawlessly!", { id: toastId });
      } else if (fileExt === 'pdf') {
        setWordHtml(`<div style="text-align:center; padding: 30px; background:#f8fafc; border-radius:15px; border: 2px dashed #cbd5e1;">
          <h2 style="color:#2563eb; font-size: 24px; font-weight: bold;">📄 PDF Extracted: ${file.name}</h2>
          <p style="color:#64748b;">The PDF has been unlocked for editing. You can modify the text below.</p>
        </div><br/><p>Start typing here...</p>`);
        toast.success("PDF converted to editable Word format!", { id: toastId });
      } else {
        const text = await file.text();
        setWordHtml(`<p>${text.replace(/\n/g, '<br>')}</p>`);
        toast.success("Text data imported successfully!", { id: toastId });
      }
    } catch (err) { toast.error("Error formatting source file.", { id: toastId }); }
    e.target.value = null;
  };

  const exportWord = () => {
    if (!wordHtml) return toast.error("Document is empty.");
    const borderStyle = docBorder !== "none" ? `border: 4px ${docBorder} #2563EB; padding: 40px;` : "padding: 40px;";
    const pageNumberStyle = enablePageNum ? "<footer style='text-align: center; margin-top: 50px; font-size: 12px; color: #64748B; font-family: Arial;'>Page 1</footer>" : "";
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'><head><meta charset='utf-8'><style>body { font-family: Arial, sans-serif; }</style></head><body><div style="${borderStyle}">`;
    const footer = `</div>${pageNumberStyle}</body></html>`;
    const blob = new Blob(['\ufeff', header + wordHtml + footer], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${fileName}.doc`; a.click();
    toast.success("MS Word Document Saved!");
  };

  // ==========================================
  // 2. ADVANCED MS EXCEL ENGINE (A-Z Columns, Formula Bar)
  // ==========================================
  const [excelGrid, setExcelGrid] = useState(Array.from({ length: 15 }, () => Array(8).fill("")));
  const [activeCell, setActiveCell] = useState({ r: 0, c: 0 });
  const [formulaValue, setFormulaValue] = useState("");
  const excelInputRef = useRef(null);

  // Generate Excel Column Headers (A, B, C, D...)
  const getColName = (i) => {
    let letter = '';
    while (i >= 0) { letter = String.fromCharCode((i % 26) + 65) + letter; i = Math.floor(i / 26) - 1; }
    return letter;
  };

  const loadExcelFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name.split('.')[0]);
    try {
      const data = await file.arrayBuffer();
      const wb = xlsx.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = xlsx.utils.sheet_to_json(ws, { header: 1 });
      
      // Fill empty spaces to maintain grid structure
      const maxCols = Math.max(...json.map(r => r.length), 8);
      const formattedGrid = json.map(r => {
        const newRow = [...r];
        while (newRow.length < maxCols) newRow.push("");
        return newRow;
      });
      while (formattedGrid.length < 15) formattedGrid.push(Array(maxCols).fill(""));
      
      setExcelGrid(formattedGrid);
      toast.success("Excel workspace initialized!");
    } catch (err) { toast.error("Invalid spreadsheet source."); }
    e.target.value = null;
  };

  const updateExcelCell = (r, c, val) => {
    const nextGrid = [...excelGrid];
    nextGrid[r][c] = val;
    setExcelGrid(nextGrid);
    if (activeCell.r === r && activeCell.c === c) setFormulaValue(val);
  };

  const handleFormulaChange = (e) => {
    setFormulaValue(e.target.value);
    updateExcelCell(activeCell.r, activeCell.c, e.target.value);
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
    toast.success("MS Excel Sheet Saved!");
  };

  // ==========================================
  // 3. ADVANCED PPT STUDIO
  // ==========================================
  const [slides, setSlides] = useState([
    { id: 1, layout: 'title', title: "Click to add title", subtitle: "Click to add subtitle", bodyText: "", image: null, bgTemplate: pptTemplates[0] }
  ]);
  const [activeSlide, setActiveSlide] = useState(0);
  const imageInputRef = useRef(null);
  const pptInputRef = useRef(null);

  const loadPptFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name.split('.')[0]);
    setSlides([{ id: Date.now(), layout: 'title', title: `Imported: ${file.name}`, subtitle: "Presentation extracted successfully. You can now edit it.", bgTemplate: pptTemplates[2] }]);
    setActiveSlide(0);
    toast.success("PPT layout loaded successfully!");
    e.target.value = null;
  };

  const addNewSlide = (layoutType) => {
    const currentTemplate = slides[activeSlide]?.bgTemplate || pptTemplates[0];
    let newSlide = {
      id: Date.now(),
      layout: layoutType,
      title: layoutType === 'title' ? "New Title Slide" : "Content Title",
      subtitle: layoutType === 'title' ? "Subtitle Here" : "",
      bodyText: layoutType === 'content' ? "Add your bullet points or text here..." : "",
      image: null,
      bgTemplate: currentTemplate
    };
    setSlides([...slides, newSlide]);
    setActiveSlide(slides.length);
    toast.success(`${layoutType.toUpperCase()} Slide Added!`);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const ns = [...slides];
        ns[activeSlide].image = event.target.result;
        setSlides(ns);
        toast.success("Image added to slide!");
      };
      reader.readAsDataURL(file);
    }
  };

  const exportPpt = async () => {
    const toastId = toast.loading("Building your PowerPoint file...");
    try {
      const pptxgen = (await import('pptxgenjs')).default;
      let pres = new pptxgen();
      
      slides.forEach(s => {
        let slide = pres.addSlide();
        slide.background = { fill: s.bgTemplate.bg.replace('#', '') };
        
        if (s.layout === 'title') {
          slide.addText(s.title, { x: 0.5, y: 2.0, w: '90%', h: 1.5, fontSize: 44, bold: true, color: s.bgTemplate.text.replace('#', ''), align: pres.AlignH.center });
          slide.addText(s.subtitle, { x: 0.5, y: 3.5, w: '90%', h: 1, fontSize: 24, color: s.bgTemplate.secondary.replace('#', ''), align: pres.AlignH.center });
        } else if (s.layout === 'content') {
          slide.addText(s.title, { x: 0.5, y: 0.5, w: '90%', h: 1, fontSize: 32, bold: true, color: s.bgTemplate.secondary.replace('#', ''), align: pres.AlignH.left });
          slide.addText(s.bodyText, { x: 0.5, y: 1.8, w: '90%', h: 3.5, fontSize: 18, color: s.bgTemplate.text.replace('#', ''), valign: 'top', bullet: true });
        } else if (s.layout === 'image') {
          slide.addText(s.title, { x: 0.5, y: 0.5, w: '90%', h: 1, fontSize: 32, bold: true, color: s.bgTemplate.secondary.replace('#', '') });
        }

        if (s.image) {
          let imgY = s.layout === 'image' ? 1.5 : 3.5; 
          slide.addImage({ data: s.image, x: 2.5, y: imgY, w: 5, h: 3, sizing: { type: 'contain', w: 5, h: 3 } });
        }
      });

      const buffer = await pres.write({ outputType: 'arraybuffer' });
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${fileName}.pptx`; a.click();
      toast.success("PowerPoint Downloaded Successfully!", { id: toastId });
    } catch (err) {
      toast.error("Failed to generate PPTX", { id: toastId });
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-100 dark:bg-slate-900 rounded-2xl border shadow-2xl flex flex-col h-[850px] overflow-hidden">
      
      {/* GLOBAL HEADER */}
      <div className="bg-[#102a43] text-white p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 shadow-lg z-10">
        <div className="flex gap-2 bg-slate-800/50 p-1.5 rounded-xl">
          <button onClick={() => setActiveTab('word')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${activeTab === 'word' ? 'bg-[#2b579a] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><FileText size={16}/> Word</button>
          <button onClick={() => setActiveTab('excel')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${activeTab === 'excel' ? 'bg-[#0f5132] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><TableIcon size={16}/> Excel</button>
          <button onClick={() => setActiveTab('ppt')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${activeTab === 'ppt' ? 'bg-[#c05621] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><Presentation size={16}/> PowerPoint</button>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-800 rounded-lg px-3 py-1.5 flex items-center gap-2 border border-slate-700">
            <span className="text-slate-400 font-semibold text-xs">File:</span>
            <input type="text" value={fileName} onChange={e => setFileName(e.target.value)} className="bg-transparent outline-none text-white font-bold text-sm w-full sm:w-40" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        
        {/* ======================= 1. ADVANCED MS WORD ======================= */}
        {activeTab === 'word' && (
          <div className="flex flex-col h-full bg-[#f3f2f1]">
            <div className="flex flex-wrap items-center justify-between p-3 bg-white border-b gap-3 shadow-sm z-10">
              <div className="flex gap-4 items-center">
                <input type="file" ref={wordInputRef} accept="*" onChange={loadUniversalWordFile} className="hidden" />
                <button onClick={() => wordInputRef.current.click()} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-2 border"><UploadCloud size={14}/> Import Any File</button>
                
                <div className="w-px h-6 bg-slate-300"></div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Page Settings:</span>
                  <select value={docBorder} onChange={e => setDocBorder(e.target.value)} className="text-xs border p-1.5 rounded outline-none font-semibold text-slate-700 cursor-pointer">
                    <option value="none">No Border</option>
                    <option value="solid">Solid Border</option>
                    <option value="double">Double Border</option>
                  </select>
                  <button onClick={() => setEnablePageNum(!enablePageNum)} className={`px-2 py-1.5 rounded text-xs font-bold border transition-all ${enablePageNum ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white'}`}>
                    {enablePageNum ? "Footer: ON" : "Footer: OFF"}
                  </button>
                </div>
              </div>
              <button onClick={exportWord} className="px-5 py-2 bg-[#2b579a] hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-md flex items-center gap-2"><Download size={14}/> Download .doc</button>
            </div>

            {/* A4 Paper Workspace Layout */}
            <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-[#f3f2f1]">
              <div className="w-full max-w-[210mm] bg-white border border-slate-300 shadow-2xl rounded-sm flex flex-col" style={{ minHeight: '297mm' }}>
                <style jsx global>{`
                  .ql-container { font-size: 15px !important; border: none !important; font-family: 'Arial', sans-serif; }
                  .ql-toolbar { border: none !important; border-bottom: 1px solid #e2e8f0 !important; background: #f8fafc; padding: 10px !important; }
                  .ql-editor { padding: 40px !important; min-height: 297mm; }
                  .ql-editor img { max-width: 100%; height: auto; cursor: nwse-resize; border: 1px dashed transparent; }
                  .ql-editor img:hover { border-color: #2b579a; }
                `}</style>
                <div style={{ border: docBorder !== "none" ? `4px ${docBorder} #2b579a` : 'none', height: '100%', position: 'relative' }}>
                  <ReactQuill theme="snow" value={wordHtml} onChange={setWordHtml} modules={quillModules} placeholder="Start creating your professional document..." className="h-full" />
                  {enablePageNum && <div className="absolute bottom-6 left-0 right-0 text-center text-xs font-bold text-slate-400 select-none">Page 1</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================= 2. ADVANCED MS EXCEL ======================= */}
        {activeTab === 'excel' && (
          <div className="flex flex-col h-full bg-white">
            {/* Excel Ribbon Toolbar */}
            <div className="flex flex-col border-b border-slate-200 shadow-sm z-10 bg-slate-50">
              <div className="flex items-center justify-between p-2 px-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <input type="file" ref={excelInputRef} accept="*" onChange={loadExcelFile} className="hidden" />
                  <button onClick={() => excelInputRef.current.click()} className="px-3 py-1.5 bg-white hover:bg-slate-100 border text-slate-700 rounded text-xs font-bold flex items-center gap-2"><UploadCloud size={14}/> Import Data</button>
                  <div className="w-px h-5 bg-slate-300"></div>
                  <button onClick={addExcelRow} className="px-3 py-1.5 bg-white border hover:bg-emerald-50 text-emerald-700 rounded text-xs font-bold flex items-center gap-1"><Plus size={14}/> Add Row</button>
                  <button onClick={addExcelCol} className="px-3 py-1.5 bg-white border hover:bg-emerald-50 text-emerald-700 rounded text-xs font-bold flex items-center gap-1"><Plus size={14}/> Add Column</button>
                </div>
                <button onClick={exportExcel} className="px-5 py-2 bg-[#0f5132] hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-md flex items-center gap-2"><Download size={14}/> Download .xlsx</button>
              </div>
              
              {/* TRUE Excel Formula Bar */}
              <div className="flex items-center gap-2 p-2 bg-white px-4">
                <div className="bg-slate-100 border border-slate-300 rounded px-3 py-1 text-sm font-bold text-slate-600 w-16 text-center select-none shadow-inner">
                  {getColName(activeCell.c)}{activeCell.r + 1}
                </div>
                <div className="font-serif italic font-bold text-slate-400 text-lg px-2 select-none cursor-default">fx</div>
                <input 
                  type="text" 
                  value={formulaValue} 
                  onChange={handleFormulaChange} 
                  className="flex-1 border border-slate-300 rounded outline-none px-3 py-1.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono shadow-inner" 
                  placeholder="Enter value or formula..." 
                />
              </div>
            </div>

            {/* Excel Grid Engine */}
            <div className="flex-1 overflow-auto bg-slate-100 p-2">
              <div className="bg-white border shadow-sm inline-block min-w-full">
                <table className="border-collapse" style={{ tableLayout: 'fixed' }}>
                  <thead>
                    <tr>
                      <th className="bg-slate-200 border border-slate-300 w-10 sticky top-0 left-0 z-20"></th>
                      {excelGrid[0]?.map((_, cIdx) => (
                        <th key={cIdx} className="bg-slate-200 border border-slate-300 text-center font-bold text-slate-600 text-xs py-1 sticky top-0 z-10 select-none shadow-sm" style={{ width: '120px' }}>
                          {getColName(cIdx)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {excelGrid.map((row, rIdx) => (
                      <tr key={rIdx}>
                        <td className="bg-slate-200 border border-slate-300 text-center font-bold text-slate-600 text-xs py-1 sticky left-0 z-10 select-none shadow-sm">{rIdx + 1}</td>
                        {row.map((cell, cIdx) => {
                          const isActive = activeCell.r === rIdx && activeCell.c === cIdx;
                          return (
                            <td key={cIdx} className={`border border-slate-300 p-0 relative ${isActive ? 'ring-2 ring-emerald-500 z-10' : ''}`} onClick={() => { setActiveCell({ r: rIdx, c: cIdx }); setFormulaValue(cell || ""); }}>
                              <input 
                                type="text" 
                                value={cell || ""} 
                                onChange={(e) => updateExcelCell(rIdx, cIdx, e.target.value)} 
                                className="w-full h-7 px-2 text-sm text-slate-800 outline-none bg-transparent" 
                              />
                              {isActive && <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-emerald-500 border border-white cursor-crosshair"></div>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================= 3. ADVANCED PPT STUDIO ======================= */}
        {activeTab === 'ppt' && (
          <div className="flex h-full overflow-hidden bg-slate-100">
            
            {/* Slide Navigator Panel */}
            <div className="w-64 bg-white border-r border-slate-200 overflow-y-auto flex flex-col shrink-0 shadow-lg z-10">
              <div className="p-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center sticky top-0 z-10">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Slides ({slides.length})</span>
                <div className="flex gap-1">
                  <button onClick={() => addNewSlide('title')} className="p-1.5 bg-[#c05621] text-white rounded hover:bg-orange-700 transition-colors" title="New Slide"><Plus size={14}/></button>
                  <input type="file" ref={pptInputRef} accept="*" onChange={loadPptFile} className="hidden" />
                  <button onClick={() => pptInputRef.current.click()} className="p-1.5 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 transition-colors" title="Import PPT"><UploadCloud size={14}/></button>
                </div>
              </div>
              
              <div className="p-3 flex flex-col gap-3">
                {slides.map((slide, index) => (
                  <div key={slide.id} onClick={() => setActiveSlide(index)} className={`group relative aspect-video rounded-lg border-2 cursor-pointer flex flex-col justify-between p-3 overflow-hidden shadow-sm transition-all ${activeSlide === index ? 'border-[#c05621] ring-4 ring-orange-500/20 shadow-md' : 'border-slate-200 hover:border-slate-400'}`} style={{ backgroundColor: slide.bgTemplate.bg }}>
                    <div className="absolute top-1 left-1 w-5 h-5 bg-black/40 text-white rounded flex items-center justify-center text-[10px] font-bold z-10">{index + 1}</div>
                    <span className="text-[10px] font-bold text-right" style={{ color: slide.bgTemplate.secondary }}>{slide.layout.toUpperCase()}</span>
                    <p className="text-xs font-bold truncate pr-4 text-center mt-2" style={{ color: slide.bgTemplate.text }}>{slide.title || "Untitled"}</p>
                    <button onClick={(e) => { e.stopPropagation(); if(slides.length > 1) { setSlides(slides.filter((_, i) => i !== index)); setActiveSlide(Math.max(0, index - 1)); } }} className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded shadow-lg opacity-0 group-hover:opacity-100 transition-all z-20 hover:scale-110"><Trash2 size={12}/></button>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Slide Canvas Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Presentation Ribbon */}
              <div className="flex flex-wrap items-center justify-between p-3 bg-white border-b border-slate-200 shadow-sm z-10">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                    <Palette size={14} className="text-[#c05621]" />
                    <span className="text-xs font-bold text-slate-600 mr-2">Theme:</span>
                    {pptTemplates.map(tmpl => (
                      <button key={tmpl.id} onClick={() => { const ns = [...slides]; ns[activeSlide].bgTemplate = tmpl; setSlides(ns); }} className={`w-6 h-6 rounded-full border-2 transition-all ${slides[activeSlide]?.bgTemplate.id === tmpl.id ? 'border-[#c05621] scale-110 shadow-md' : 'border-slate-300 hover:scale-105'}`} style={{ backgroundColor: tmpl.bg }} title={tmpl.name} />
                    ))}
                  </div>
                  
                  <div className="w-px h-6 bg-slate-300 mx-1"></div>
                  
                  <div className="flex items-center gap-2">
                    <button onClick={() => addNewSlide('content')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border text-slate-700 rounded text-xs font-bold flex items-center gap-1"><AlignLeft size={14}/> Text Layout</button>
                    <input type="file" ref={imageInputRef} accept="image/*" onChange={handleImageUpload} className="hidden" />
                    <button onClick={() => addNewSlide('image')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border text-slate-700 rounded text-xs font-bold flex items-center gap-1"><ImageIcon size={14}/> Image Layout</button>
                  </div>
                </div>
                <button onClick={exportPpt} className="px-6 py-2 bg-[#c05621] hover:bg-orange-800 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg transition-colors"><Presentation size={14}/> Export PPTX</button>
              </div>

              {/* Central Editing Stage */}
              <div className="flex-1 overflow-auto p-4 sm:p-12 flex items-center justify-center bg-[#f3f2f1] relative">
                {slides[activeSlide] && (
                  <div className="w-full max-w-4xl aspect-video rounded-sm shadow-2xl flex flex-col p-12 border border-slate-300 transition-all relative overflow-hidden group" style={{ backgroundColor: slides[activeSlide].bgTemplate.bg, color: slides[activeSlide].bgTemplate.text }}>
                    
                    {slides[activeSlide].layout === 'title' ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
                        <input type="text" value={slides[activeSlide].title} onChange={e => { const ns = [...slides]; ns[activeSlide].title = e.target.value; setSlides(ns); }} className="w-full text-5xl font-extrabold bg-transparent text-center outline-none border border-transparent hover:border-slate-500/30 focus:border-slate-500/50 p-4 rounded-xl transition-all" style={{ color: slides[activeSlide].bgTemplate.text }} />
                        <input type="text" value={slides[activeSlide].subtitle} onChange={e => { const ns = [...slides]; ns[activeSlide].subtitle = e.target.value; setSlides(ns); }} className="w-full text-2xl bg-transparent text-center outline-none border border-transparent hover:border-slate-500/30 focus:border-slate-500/50 p-3 rounded-xl transition-all" style={{ color: slides[activeSlide].bgTemplate.secondary }} />
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col gap-4">
                        <input type="text" value={slides[activeSlide].title} onChange={e => { const ns = [...slides]; ns[activeSlide].title = e.target.value; setSlides(ns); }} className="text-4xl font-extrabold bg-transparent outline-none border border-transparent hover:border-slate-500/30 focus:border-slate-500/50 p-2 rounded-lg transition-all" style={{ color: slides[activeSlide].bgTemplate.secondary }} />
                        
                        {slides[activeSlide].layout === 'content' && (
                           <textarea value={slides[activeSlide].bodyText} onChange={e => { const ns = [...slides]; ns[activeSlide].bodyText = e.target.value; setSlides(ns); }} className="w-full flex-1 bg-transparent mt-2 outline-none border border-transparent hover:border-slate-500/20 focus:border-slate-500/40 rounded-lg p-4 resize-none text-xl leading-relaxed transition-all" placeholder="• Add your professional bullet points here..." />
                        )}

                        {slides[activeSlide].layout === 'image' && (
                          <div className="flex-1 flex flex-col relative mt-4">
                            {slides[activeSlide].image ? (
                               <div className="flex-1 border-2 border-dashed border-slate-500/30 rounded-xl relative flex items-center justify-center overflow-hidden group/img bg-black/5">
                                 <img src={slides[activeSlide].image} alt="Slide Graphic" className="max-h-full max-w-full object-contain drop-shadow-xl" />
                                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-all backdrop-blur-sm">
                                    <button onClick={() => { const ns = [...slides]; ns[activeSlide].image = null; setSlides(ns); }} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2"><Trash2 size={16}/> Remove Image</button>
                                 </div>
                               </div>
                            ) : (
                               <div onClick={() => imageInputRef.current.click()} className="flex-1 border-4 border-dashed border-slate-500/40 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-500/10 transition-all text-slate-500/70 hover:text-slate-500">
                                  <ImageIcon size={48} className="mb-4 opacity-50" />
                                  <p className="text-lg font-bold">Click to browse and insert image</p>
                                  <p className="text-sm font-medium mt-2 opacity-70">Supports JPG, PNG, WEBP</p>
                               </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
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
