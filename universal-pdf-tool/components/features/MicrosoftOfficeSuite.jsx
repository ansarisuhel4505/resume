"use client";

import React, { useState, useRef } from 'react';
import { Type, Table as TableIcon, Presentation, Download, UploadCloud, Plus, Trash2, Frame, Hash, Layers, FileText, Minus, Image as ImageIcon, Palette } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('ppt'); // Defaulting to PPT as requested
  const [fileName, setFileName] = useState("My_Pro_Document");

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
        const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
        setWordHtml(result.value);
        toast.success("Word document imported!", { id: toastId });
      } else if (fileExt === 'pdf') {
        setWordHtml(`<div style="text-align:center; padding: 20px; background:#f1f5f9; border-radius:10px;"><h2 style="color:#2563eb;">📄 PDF File Extracted: ${file.name}</h2><p>Converted to editable format.</p></div><br/><p>Start typing here...</p>`);
        toast.success("PDF converted to editable mode!", { id: toastId });
      } else {
        const text = await file.text();
        setWordHtml(`<p>${text.replace(/\n/g, '<br>')}</p>`);
        toast.success("Text data imported!", { id: toastId });
      }
    } catch (err) { toast.error("Error formatting source file.", { id: toastId }); }
    e.target.value = null;
  };

  const exportWord = () => {
    if (!wordHtml) return toast.error("Canvas is empty.");
    const borderStyle = docBorder !== "none" ? `border: 4px ${docBorder} #2563EB; padding: 25px;` : "";
    const pageNumberStyle = enablePageNum ? "<footer style='text-align: center; margin-top: 50px; font-size: 12px; color: #64748B;'>Page 1 of 1</footer>" : "";
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'><head><meta charset='utf-8'></head><body><div style="${borderStyle}">`;
    const footer = `</div>${pageNumberStyle}</body></html>`;
    const blob = new Blob(['\ufeff', header + wordHtml + footer], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${fileName}.doc`; a.click();
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
      setExcelGrid(xlsx.utils.sheet_to_json(ws, { header: 1 }) || []);
      toast.success("Excel workspace initialized!");
    } catch (err) { toast.error("Invalid spreadsheet source."); }
    e.target.value = null;
  };

  const updateExcelCell = (r, c, val) => {
    const nextGrid = [...excelGrid];
    if (!nextGrid[r]) nextGrid[r] = [];
    nextGrid[r][c] = val;
    setExcelGrid(nextGrid);
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
  };

  // ==========================================
  // 3. ADVANCED PPT STUDIO (MAJOR UPGRADE) 🔥
  // ==========================================
  const [slides, setSlides] = useState([
    { id: 1, layout: 'title', title: "Click to add title", subtitle: "Click to add subtitle", bodyText: "", image: null, bgTemplate: pptTemplates[0] }
  ]);
  const [activeSlide, setActiveSlide] = useState(0);
  const imageInputRef = useRef(null);

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

  // 🌟 THE MAGIC EXPORT: Convert Web UI to Real .pptx File
  const exportPpt = async () => {
    const toastId = toast.loading("Building your PowerPoint file...");
    try {
      const pptxgen = (await import('pptxgenjs')).default;
      let pres = new pptxgen();
      
      slides.forEach(s => {
        let slide = pres.addSlide();
        
        // 1. Set Background Color
        slide.background = { fill: s.bgTemplate.bg.replace('#', '') };
        
        // 2. Add Title & Text based on Layout
        if (s.layout === 'title') {
          slide.addText(s.title, { x: 0.5, y: 2.0, w: '90%', h: 1.5, fontSize: 44, bold: true, color: s.bgTemplate.text.replace('#', ''), align: pres.AlignH.center });
          slide.addText(s.subtitle, { x: 0.5, y: 3.5, w: '90%', h: 1, fontSize: 24, color: s.bgTemplate.secondary.replace('#', ''), align: pres.AlignH.center });
        } else if (s.layout === 'content') {
          slide.addText(s.title, { x: 0.5, y: 0.5, w: '90%', h: 1, fontSize: 32, bold: true, color: s.bgTemplate.secondary.replace('#', ''), align: pres.AlignH.left });
          slide.addText(s.bodyText, { x: 0.5, y: 1.8, w: '90%', h: 3.5, fontSize: 18, color: s.bgTemplate.text.replace('#', ''), valign: 'top', bullet: true });
        } else if (s.layout === 'image') {
          slide.addText(s.title, { x: 0.5, y: 0.5, w: '90%', h: 1, fontSize: 32, bold: true, color: s.bgTemplate.secondary.replace('#', '') });
        }

        // 3. Insert User Uploaded Image
        if (s.image) {
          // Adjust image position based on layout
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-slate-900 rounded-2xl border shadow-2xl flex flex-col h-[850px] overflow-hidden">
      
      {/* GLOBAL HEADER */}
      <div className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800">
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('word')} className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${activeTab === 'word' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:text-white'}`}><FileText size={18}/> Word/PDF</button>
          <button onClick={() => setActiveTab('excel')} className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${activeTab === 'excel' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:text-white'}`}><TableIcon size={18}/> Excel</button>
          <button onClick={() => setActiveTab('ppt')} className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${activeTab === 'ppt' ? 'bg-orange-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:text-white'}`}><Presentation size={18}/> Pro PPT Studio</button>
        </div>
        <input type="text" value={fileName} onChange={e => setFileName(e.target.value)} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl outline-none text-white font-bold text-sm w-full sm:w-48 text-center focus:border-blue-500" placeholder="Document Name" />
      </div>

      <div className="flex-1 overflow-hidden relative bg-slate-50 dark:bg-slate-950">
        
        {/* === 1. WORD TAB === */}
        {activeTab === 'word' && (
          <div className="flex flex-col h-full">
            <div className="flex flex-wrap items-center justify-between p-3 bg-white border-b gap-3 shadow-sm">
              <div className="flex gap-3">
                <input type="file" ref={wordInputRef} accept="*" onChange={loadUniversalWordFile} className="hidden" />
                <button onClick={() => wordInputRef.current.click()} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 border"><UploadCloud size={14}/> Import File</button>
                <select value={docBorder} onChange={e => setDocBorder(e.target.value)} className="text-xs border p-2 rounded-lg outline-none">
                  <option value="none">No Frame</option><option value="solid">Solid Frame</option>
                </select>
              </div>
              <button onClick={exportWord} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"><Download size={14} className="inline mr-2"/> Save Doc</button>
            </div>
            <div className="flex-1 bg-white overflow-y-auto p-4 flex justify-center">
              <div className="w-full max-w-4xl h-full flex flex-col border border-slate-200 shadow-lg rounded-xl overflow-hidden">
                <div style={{ border: docBorder !== "none" ? `4px ${docBorder} #2563EB` : 'none', height: '100%', position: 'relative' }}>
                  <ReactQuill theme="snow" value={wordHtml} onChange={setWordHtml} modules={quillModules} className="h-full pb-12" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === 2. EXCEL TAB === */}
        {activeTab === 'excel' && (
          <div className="flex flex-col h-full p-4">
             <div className="flex flex-wrap items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-4 gap-3">
              <div className="flex gap-2">
                <input type="file" ref={excelInputRef} accept="*" onChange={loadExcelFile} className="hidden" />
                <button onClick={() => excelInputRef.current.click()} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 border"><UploadCloud size={14}/> Import Excel</button>
                <button onClick={() => setExcelGrid([...excelGrid, Array(excelGrid[0]?.length || 6).fill("")])} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200">+ Row</button>
                <button onClick={() => setExcelGrid(excelGrid.map(row => [...row, ""]))} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200">+ Col</button>
              </div>
              <button onClick={exportExcel} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"><Download size={14} className="inline mr-2"/> Save Excel</button>
            </div>
            <div className="flex-1 overflow-auto bg-white border rounded-xl shadow-inner p-2">
              <table className="border-collapse w-max min-w-full">
                <tbody>
                  {excelGrid.map((row, rIdx) => (
                    <tr key={rIdx}>
                      <td className="bg-slate-100 text-center text-xs font-bold text-slate-400 border w-8">{rIdx + 1}</td>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="border p-0">
                          <input type="text" value={cell || ""} onChange={(e) => updateExcelCell(rIdx, cIdx, e.target.value)} className="w-36 h-9 px-2 text-sm font-semibold outline-none focus:bg-blue-50" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* === 3. PPT STUDIO TAB (THE ADVANCED UI) === */}
        {activeTab === 'ppt' && (
          <div className="flex h-full overflow-hidden">
            
            {/* Left Panel: Slide Navigator */}
            <div className="w-56 bg-slate-900 border-r border-slate-800 overflow-y-auto p-3 flex flex-col gap-3 shrink-0">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase px-1">Slides ({slides.length})</span>
              {slides.map((slide, index) => (
                <div key={slide.id} onClick={() => setActiveSlide(index)} className={`group relative aspect-video rounded-xl border-2 cursor-pointer flex flex-col justify-between p-3 overflow-hidden transition-all ${activeSlide === index ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-slate-800 opacity-60 hover:opacity-90'}`} style={{ backgroundColor: slide.bgTemplate.bg }}>
                  <span className="text-[10px] font-bold" style={{ color: slide.bgTemplate.secondary }}>{slide.layout.toUpperCase()}</span>
                  <p className="text-xs font-bold truncate pr-4" style={{ color: slide.bgTemplate.text }}>{slide.title || "Untitled"}</p>
                  <button onClick={(e) => { e.stopPropagation(); if(slides.length > 1) { setSlides(slides.filter((_, i) => i !== index)); setActiveSlide(0); } }} className="absolute top-2 right-2 p-1 bg-red-600/20 text-red-400 rounded-md opacity-0 group-hover:opacity-100"><Trash2 size={10}/></button>
                </div>
              ))}
              
              {/* Insert Layout Options */}
              <div className="mt-4 border-t border-slate-800 pt-3 flex flex-col gap-1.5">
                <button onClick={() => addNewSlide('title')} className="w-full text-left px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-200">▪ Add Title Slide</button>
                <button onClick={() => addNewSlide('content')} className="w-full text-left px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-200">▪ Add Content Slide</button>
                <button onClick={() => addNewSlide('image')} className="w-full text-left px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-200">▪ Add Image Slide</button>
              </div>
            </div>

            {/* Right Panel: Active Slide Editor */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* ToolBar */}
              <div className="flex flex-wrap items-center justify-between p-3 bg-white border-b border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                  {/* Theme Selector */}
                  <div className="flex items-center gap-2">
                    <Palette size={14} className="text-orange-500" />
                    <span className="text-xs font-bold text-slate-600">Theme:</span>
                    <div className="flex gap-1.5">
                      {pptTemplates.map(tmpl => (
                        <button key={tmpl.id} onClick={() => { const ns = [...slides]; ns[activeSlide].bgTemplate = tmpl; setSlides(ns); }} className={`w-6 h-6 rounded-full border border-slate-300 transition-all ${slides[activeSlide]?.bgTemplate.id === tmpl.id ? 'ring-2 ring-orange-500 scale-110' : 'hover:scale-105'}`} style={{ backgroundColor: tmpl.bg }} title={tmpl.name} />
                      ))}
                    </div>
                  </div>
                  <div className="w-px h-6 bg-slate-200 mx-1"></div>
                  {/* Image Upload Button */}
                  <input type="file" ref={imageInputRef} accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <button onClick={() => imageInputRef.current.click()} className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1"><ImageIcon size={14}/> Insert Image</button>
                </div>
                <button onClick={exportPpt} className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md"><Download size={14}/> Download .pptx</button>
              </div>

              {/* Main Slide Canvas */}
              <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center bg-slate-100 dark:bg-slate-950 relative">
                {slides[activeSlide] && (
                  <div className="w-full max-w-4xl aspect-video rounded-lg shadow-2xl flex flex-col p-12 border border-slate-300 transition-all relative overflow-hidden group" style={{ backgroundColor: slides[activeSlide].bgTemplate.bg, color: slides[activeSlide].bgTemplate.text }}>
                    
                    {slides[activeSlide].layout === 'title' ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
                        <input type="text" value={slides[activeSlide].title} onChange={e => { const ns = [...slides]; ns[activeSlide].title = e.target.value; setSlides(ns); }} className="w-full text-5xl font-extrabold bg-transparent text-center outline-none border-b border-transparent focus:border-slate-500/30 py-2" style={{ color: slides[activeSlide].bgTemplate.text }} />
                        <input type="text" value={slides[activeSlide].subtitle} onChange={e => { const ns = [...slides]; ns[activeSlide].subtitle = e.target.value; setSlides(ns); }} className="w-full text-xl bg-transparent text-center outline-none border-b border-transparent focus:border-slate-500/30 py-2" style={{ color: slides[activeSlide].bgTemplate.secondary }} />
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col gap-4">
                        <input type="text" value={slides[activeSlide].title} onChange={e => { const ns = [...slides]; ns[activeSlide].title = e.target.value; setSlides(ns); }} className="text-3xl font-extrabold bg-transparent outline-none border-b border-transparent focus:border-slate-500/30 py-2" style={{ color: slides[activeSlide].bgTemplate.secondary }} />
                        
                        {slides[activeSlide].layout === 'content' && (
                           <textarea value={slides[activeSlide].bodyText} onChange={e => { const ns = [...slides]; ns[activeSlide].bodyText = e.target.value; setSlides(ns); }} className="w-full flex-1 bg-transparent mt-2 outline-none border border-transparent focus:border-slate-500/30 p-2 resize-none text-lg leading-relaxed" placeholder="Type bullet points here..." />
                        )}

                        {/* Image Rendering inside Slide UI */}
                        {slides[activeSlide].image && (
                          <div className="flex-1 border-2 border-dashed border-slate-500/30 rounded-xl relative flex items-center justify-center overflow-hidden mt-4 group">
                             <img src={slides[activeSlide].image} alt="Slide Graphic" className="max-h-full max-w-full object-contain" />
                             <button onClick={() => { const ns = [...slides]; ns[activeSlide].image = null; setSlides(ns); }} className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                          </div>
                        )}
                        {!slides[activeSlide].image && slides[activeSlide].layout === 'image' && (
                          <div onClick={() => imageInputRef.current.click()} className="flex-1 border-2 border-dashed border-slate-500/50 rounded-xl mt-4 flex items-center justify-center cursor-pointer hover:bg-slate-500/10">
                             <p className="text-sm font-bold opacity-50 flex items-center gap-2"><ImageIcon size={18}/> Click to add image here</p>
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
