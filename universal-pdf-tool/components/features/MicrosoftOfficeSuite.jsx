"use client";

import React, { useState, useRef } from 'react';
import { Type, Table as TableIcon, Presentation, Download, UploadCloud, Plus, Minus, FileText, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import mammoth from 'mammoth';
import * as xlsx from 'xlsx';
import pptxgen from 'pptxgenjs';

// ReactQuill for MS Word like Visual Editing
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

export default function MicrosoftOfficeSuite() {
  const [activeTab, setActiveTab] = useState('word');
  const [fileName, setFileName] = useState("My_Document");

  // ==========================================
  // 1. MS WORD VISUAL EDITOR STATE
  // ==========================================
  const [wordHtml, setWordHtml] = useState("");
  const wordInputRef = useRef(null);

  // Full MS Word Features for Toolbar
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
      ['clean']
    ]
  };

  const loadWordFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name.split('.')[0]);
    const toastId = toast.loading("Loading Word Document...");
    try {
      const arrayBuffer = await file.arrayBuffer();
      // mammoth converts the uploaded .docx to HTML so we can edit it visually
      const result = await mammoth.convertToHtml({ arrayBuffer });
      setWordHtml(result.value);
      toast.success("Document loaded! You can now edit it visually.", { id: toastId });
    } catch (err) { 
      toast.error("Failed to load DOCX. Ensure it's a valid Word file.", { id: toastId }); 
    }
    e.target.value = null;
  };

  const exportWord = () => {
    if (!wordHtml) { toast.error("Document is empty"); return; }
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'><head><meta charset='utf-8'></head><body>";
    const footer = "</body></html>";
    const blob = new Blob(['\ufeff', header + wordHtml + footer], { type: 'application/msword' });
    triggerDownload(blob, `${fileName}.doc`);
  };

  // ==========================================
  // 2. MS EXCEL VISUAL GRID STATE
  // ==========================================
  // Default grid if no file is uploaded
  const [excelGrid, setExcelGrid] = useState(Array.from({ length: 8 }, () => Array(5).fill("")));
  const excelInputRef = useRef(null);

  const loadExcelFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name.split('.')[0]);
    const toastId = toast.loading("Loading Excel Data...");
    try {
      const data = await file.arrayBuffer();
      const workbook = xlsx.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Ensure it loads properly into our 2D array visual grid
      if (jsonData.length > 0) {
        setExcelGrid(jsonData);
        toast.success("Excel sheet loaded for visual editing!", { id: toastId });
      } else {
        toast.error("Excel sheet is empty.", { id: toastId });
      }
    } catch (err) {
      toast.error("Failed to load Excel file.", { id: toastId });
    }
    e.target.value = null;
  };

  const updateExcelCell = (rowIndex, colIndex, value) => {
    const newGrid = [...excelGrid];
    if (!newGrid[rowIndex]) newGrid[rowIndex] = [];
    newGrid[rowIndex][colIndex] = value;
    setExcelGrid(newGrid);
  };

  const addExcelRow = () => setExcelGrid([...excelGrid, Array(excelGrid[0]?.length || 5).fill("")]);
  const removeExcelRow = () => excelGrid.length > 1 && setExcelGrid(excelGrid.slice(0, -1));
  const addExcelCol = () => setExcelGrid(excelGrid.map(row => [...row, ""]));
  const removeExcelCol = () => excelGrid[0]?.length > 1 && setExcelGrid(excelGrid.map(row => row.slice(0, -1)));

  const exportExcel = () => {
    const ws = xlsx.utils.aoa_to_sheet(excelGrid);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Sheet1");
    const buffer = xlsx.write(wb, { type: 'array', bookType: 'xlsx' });
    triggerDownload(new Blob([buffer]), `${fileName}.xlsx`);
  };

  // ==========================================
  // UTILITY DOWNLOAD FUNCTION
  // ==========================================
  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded: ${filename}`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border shadow-xl min-h-[700px] flex flex-col">
      
      {/* HEADER SECTION */}
      <div className="flex items-center gap-3 mb-6 border-b pb-4">
        <Zap className="text-blue-600 w-8 h-8" />
        <div>
          <h2 className="text-xl font-extrabold">Microsoft Office Editor (Pro)</h2>
          <p className="text-sm text-slate-500">Upload your files and edit them visually directly in the browser.</p>
        </div>
      </div>

      {/* TABS FOR WORD AND EXCEL */}
      <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-lg">
        <button onClick={() => setActiveTab('word')} className={`flex-1 py-3 rounded-lg font-bold flex justify-center items-center gap-2 ${activeTab === 'word' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-white'}`}>
          <Type size={18}/> Word Document
        </button>
        <button onClick={() => setActiveTab('excel')} className={`flex-1 py-3 rounded-lg font-bold flex justify-center items-center gap-2 ${activeTab === 'excel' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 hover:bg-white'}`}>
          <TableIcon size={18}/> Excel Spreadsheet
        </button>
      </div>

      <div className="flex-1 overflow-hidden relative">
        
        {/* ======================= WORD UI ======================= */}
        {activeTab === 'word' && (
          <div className="flex flex-col h-full bg-slate-50 rounded-xl border overflow-hidden">
            <div className="flex flex-wrap items-center justify-between p-3 bg-white border-b gap-3">
              <div className="flex items-center gap-2">
                <input type="file" accept=".docx" ref={wordInputRef} onChange={loadWordFile} className="hidden" />
                <button onClick={() => wordInputRef.current.click()} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-sm font-bold flex items-center gap-2">
                  <UploadCloud size={16}/> Upload .DOCX
                </button>
                <input type="text" value={fileName} onChange={e => setFileName(e.target.value)} className="px-3 py-2 border rounded-lg outline-none font-bold text-sm w-32 sm:w-48" placeholder="File Name" />
              </div>
              <button onClick={exportWord} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold flex items-center gap-2">
                <Download size={16}/> Download Word
              </button>
            </div>
            <div className="flex-1 bg-white overflow-y-auto">
              {/* Quill Editor Custom Styling */}
              <style jsx global>{`
                .ql-container { font-size: 16px !important; border: none !important; } 
                .ql-toolbar { border: none !important; border-bottom: 1px solid #e2e8f0 !important; position: sticky; top: 0; z-index: 10; background: #f8fafc; }
                .ql-editor { min-height: 400px; }
              `}</style>
              <ReactQuill 
                theme="snow" 
                value={wordHtml} 
                onChange={setWordHtml} 
                modules={quillModules} 
                placeholder="Start typing here, or upload a .docx file to edit its text, images, and formatting..." 
              />
            </div>
          </div>
        )}

        {/* ======================= EXCEL UI ======================= */}
        {activeTab === 'excel' && (
          <div className="flex flex-col h-full bg-slate-50 rounded-xl border overflow-hidden">
            <div className="flex flex-wrap items-center justify-between p-3 bg-white border-b gap-3">
              <div className="flex items-center gap-2">
                <input type="file" accept=".xlsx, .xls, .csv" ref={excelInputRef} onChange={loadExcelFile} className="hidden" />
                <button onClick={() => excelInputRef.current.click()} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-sm font-bold flex items-center gap-2">
                  <UploadCloud size={16}/> Upload .XLSX
                </button>
                <input type="text" value={fileName} onChange={e => setFileName(e.target.value)} className="px-3 py-2 border rounded-lg outline-none font-bold text-sm w-32 sm:w-48" placeholder="File Name" />
              </div>
              <button onClick={exportExcel} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold flex items-center gap-2">
                <Download size={16}/> Download Excel
              </button>
            </div>
            
            {/* Rows and Columns Controls */}
            <div className="flex items-center gap-2 p-2 bg-slate-100 border-b">
              <span className="text-xs font-bold text-slate-500 mr-2">Grid Actions:</span>
              <button onClick={addExcelRow} className="px-3 py-1 bg-white border shadow-sm text-emerald-700 rounded text-xs font-bold flex items-center"><Plus size={14}/> Add Row</button>
              <button onClick={removeExcelRow} className="px-3 py-1 bg-white border shadow-sm text-red-600 rounded text-xs font-bold flex items-center"><Minus size={14}/> Remove Row</button>
              <div className="w-px h-6 bg-slate-300 mx-2"></div>
              <button onClick={addExcelCol} className="px-3 py-1 bg-white border shadow-sm text-emerald-700 rounded text-xs font-bold flex items-center"><Plus size={14}/> Add Col</button>
              <button onClick={removeExcelCol} className="px-3 py-1 bg-white border shadow-sm text-red-600 rounded text-xs font-bold flex items-center"><Minus size={14}/> Remove Col</button>
            </div>

            {/* Editable Spreadsheet Grid */}
            <div className="flex-1 overflow-auto bg-white p-4">
              <table className="border-collapse w-max min-w-full shadow-sm border border-slate-300">
                <tbody>
                  {excelGrid.map((row, rIndex) => (
                    <tr key={rIndex}>
                      {row.map((cell, cIndex) => (
                        <td key={cIndex} className="border border-slate-300 p-0 relative group">
                          <input 
                            type="text" 
                            value={cell || ""} 
                            onChange={(e) => updateExcelCell(rIndex, cIndex, e.target.value)}
                            className="min-w-[120px] w-full h-10 px-2 outline-none focus:bg-blue-50 text-sm font-medium text-slate-700 transition-colors"
                            placeholder="..."
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

      </div>
    </motion.div>
  );
}
