"use client";

import { useState } from "react";
import Dropzone from "../components/features/Dropzone";
import { 
  ArrowRightLeft, Layers, Minimize, 
  FileEdit, ScanText, Bot, Zap, Settings, ArrowRight 
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const tools = [
  { id: "convert", name: "Universal Convert", icon: ArrowRightLeft, desc: "PDF to Word, Images, PPT & vice versa", color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30" },
  { id: "merge", name: "Merge & Split", icon: Layers, desc: "Combine multiple PDFs or extract pages", color: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  { id: "compress", name: "Compress PDF", icon: Minimize, desc: "Reduce file size without losing quality", color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-900/30" },
  { id: "edit", name: "Advanced Edit", icon: FileEdit, desc: "Add text, signatures, watermarks & passwords", color: "text-purple-500", bg: "bg-purple-100 dark:bg-purple-900/30" },
  { id: "ocr", name: "OCR Extractor", icon: ScanText, desc: "Extract text from scanned documents", color: "text-rose-500", bg: "bg-rose-100 dark:bg-rose-900/30" },
  { id: "ai", name: "AI PDF Chat", icon: Bot, desc: "Summarize & ask questions to your PDF", color: "text-indigo-500", bg: "bg-indigo-100 dark:bg-indigo-900/30" },
];

export default function HomePage() {
  const [activeTool, setActiveTool] = useState(tools[0]);
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcess = async () => {
    if (files.length === 0) {
      toast.error("Please upload at least one file first.");
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading(`Processing with ${activeTool.name}...`);
    
    // Yahan aage chalker hum exact tools ke functions connect karenge
    setTimeout(() => {
      setIsProcessing(false);
      toast.success("Task completed successfully!", { id: toastId });
    }, 2500);
  };

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
                    setFiles([]); // Naya tool select karne par purani files clear kar do
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

          <div className="flex-1 flex flex-col justify-center">
            <Dropzone 
              files={files} 
              setFiles={setFiles} 
              maxFiles={activeTool.id === 'merge' ? 20 : 5} 
            />
          </div>

          {files.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end"
            >
              <button 
                onClick={handleProcess}
                disabled={isProcessing}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all shadow-md hover:shadow-lg ${
                  isProcessing 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-primary hover:bg-blue-600 active:scale-95'
                }`}
              >
                {isProcessing ? (
                  <>
                    <span className="animate-spin text-xl">⏳</span> Processing...
                  </>
                ) : (
                  <>
                    Start {activeTool.name.split(' ')[0]} <ArrowRight size={18} />
                  </>
                )}
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>

    </div>
  );
}
