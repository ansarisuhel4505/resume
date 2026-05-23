"use client";

import { useState } from "react";
import Dropzone from "../components/features/Dropzone";

// === SAARE TOOLS IMPORT HO GAYE ===
import PdfMerger from "../components/features/PdfMerger";
import OcrExtractor from "../components/features/OcrExtractor";
import FileConverter from "../components/features/FileConverter";
import PdfCompressor from "../components/features/PdfCompressor";
import AiPdfChat from "../components/features/AiPdfChat";
import PdfEditor from "../components/features/PdfEditor";

import { 
  ArrowRightLeft, Layers, Minimize, 
  FileEdit, ScanText, Bot, Zap, Settings 
} from "lucide-react";
import { motion } from "framer-motion";

const tools = [
  { id: "convert", name: "Universal Convert", icon: ArrowRightLeft, desc: "PDF to Word, Images, PPT & vice versa", color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30" },
  { id: "merge", name: "Merge & Split", icon: Layers, desc: "Combine multiple PDFs or extract pages", color: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  { id: "ocr", name: "OCR Extractor", icon: ScanText, desc: "Extract text from scanned documents", color: "text-rose-500", bg: "bg-rose-100 dark:bg-rose-900/30" },
  { id: "compress", name: "Compress PDF", icon: Minimize, desc: "Reduce file size without losing quality", color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-900/30" },
  { id: "edit", name: "Advanced Edit", icon: FileEdit, desc: "Add watermarks to your PDF pages", color: "text-purple-500", bg: "bg-purple-100 dark:bg-purple-900/30" },
  { id: "ai", name: "AI PDF Chat", icon: Bot, desc: "Summarize & ask questions to your PDF", color: "text-indigo-500", bg: "bg-indigo-100 dark:bg-indigo-900/30" },
];

export default function HomePage() {
  const [activeTool, setActiveTool] = useState(tools[0]);
  const [files, setFiles] = useState([]);

  // DUMMY FUNCTION GONE! Saare features ab real hain.

  return (
    <div className="flex flex-col lg:flex-row gap-8 pb-12">
      
      {/* Left Sidebar: Tool Selection */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4">
        <div className="bg-white dark:bg-darkCard p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="text-primary" size={20} />
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Pro Tools Suite</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            {tools.map((tool) => {
              const Icon = tool.icon;
              const isActive = activeTool.id === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => {
                    setActiveTool(tool);
                    setFiles([]); 
                  }}
                  className={`flex items-start gap-4 p-4 rounded-xl text-left transition-all duration-200 border ${
                    isActive 
                      ? 'border-primary bg-blue-50 dark:bg-slate-800 shadow-sm ring-1 ring-primary/20' 
                      : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${tool.bg} ${tool.color} shrink-0`}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${isActive ? 'text-primary dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}>
                      {tool.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {tool.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Area: Workspace */}
      <div className="w-full lg:w-2/3">
        <motion.div 
          key={activeTool.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-darkCard p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[500px] flex flex-col"
        >
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                <activeTool.icon className={activeTool.color} size={28} />
                {activeTool.name}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                {activeTool.desc}. Upload your files to begin.
              </p>
            </div>
            <button className="p-2 text-slate-400 hover:text-primary transition-colors bg-slate-50 dark:bg-slate-800 rounded-full hidden sm:block">
              <Settings size={20} />
            </button>
          </div>

          {/* Sirf AI Chat me hume Dropzone thoda alag dikhana padta hai ya normal rakhna padta hai */}
          <div className="flex-1 flex flex-col justify-center">
            <Dropzone 
              files={files} 
              setFiles={setFiles} 
              maxFiles={activeTool.id === 'merge' ? 20 : 5} 
            />
          </div>

          {/* === THE ULTIMATE CONNECTION: Saare tools activate ho gaye! === */}
          {files.length > 0 && activeTool.id === 'convert' && <FileConverter files={files} />}
          {files.length > 0 && activeTool.id === 'merge' && <PdfMerger files={files} onComplete={() => setFiles([])} />}
          {files.length > 0 && activeTool.id === 'ocr' && <OcrExtractor files={files} />}
          {files.length > 0 && activeTool.id === 'compress' && <PdfCompressor files={files} />}
          {files.length > 0 && activeTool.id === 'edit' && <PdfEditor files={files} />}
          {files.length > 0 && activeTool.id === 'ai' && <AiPdfChat files={files} />}

        </motion.div>
      </div>
    </div>
  );
}
