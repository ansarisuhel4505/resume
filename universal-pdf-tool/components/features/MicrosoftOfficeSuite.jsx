"use client";

import React, { useState } from 'react';
import { MicrosoftIcon, Type, Table, Presentation, FileDown, Loader2, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun, AlignmentType } from 'docx';
import * as xlsx from 'xlsx';
import pptxgen from 'pptxgenjs';

export default function MicrosoftOfficeSuite() {
  const [activeTab, setActiveTab] = useState('word');
  const [isGenerating, setIsGenerating] = useState(false);

  // WORD STATE
  const [wordData, setWordData] = useState({ title: "My Professional Document", subtitle: "Generated natively via web", content: "" });

  // EXCEL STATE
  const [excelRows, setExcelRows] = useState([
    { id: 1, name: "Suhel Khan", role: "Full Stack Developer", status: "Active" },
    { id: 2, name: "Prerna Sharma", role: "UI Designer", status: "Active" },
  ]);

  // PPT STATE
  const [pptSlides, setPptSlides] = useState([
    { id: 1, title: "Title Slide", type: "intro", text: "Introduction and subtitle", bgColor: "#4F46E5" },
    { id: 2, title: "Content Overview", type: "body", text: "Bullet point details go here...", bgColor: "#FFFFFF" }
  ]);

  const triggerDownload = (blob, extension) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pro-edition-${new Date().getTime()}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const addExcelRow = () => {
    const newId = excelRows.length > 0 ? Math.max(...excelRows.map(r => r.id)) + 1 : 1;
    setExcelRows([...excelRows, { id: newId, name: "", role: "", status: "" }]);
  };

  const removeExcelRow = (id) => {
    setExcelRows(excelRows.filter(row => row.id !== id));
  };

  const handleExcelInputChange = (id, field, value) => {
    setExcelRows(excelRows.map(row => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const generateWord = async () => {
    setIsGenerating(true);
    const toastId = toast.loading("Generating Microsoft Word Document native conversion...");
    try {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({ text: wordData.title, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
            new Paragraph({ text: "\n", children: [new TextRun(wordData.subtitle)] }),
            new Paragraph({ text: "\n\n" }),
            new Paragraph({ text: wordData.content || "Placeholder content for document generation.", alignment: AlignmentType.BOTH }),
          ],
        }],
      });
      const buffer = await Packer.toBuffer(doc);
      triggerDownload(new Blob([buffer]), 'docx');
      toast.success("DOCX generated locally!", { id: toastId });
    } catch (e) { toast.error("DOCX generation failed.", { id: toastId }); }
    finally { setIsGenerating(false); }
  };

  const generateExcel = async () => {
    setIsGenerating(true);
    const toastId = toast.loading("Generating Microsoft Excel native conversion...");
    try {
      const worksheet = xlsx.utils.json_to_sheet(excelRows.map(({ id, ...rest }) => rest));
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, "Employees");
      const outBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      triggerDownload(new Blob([outBuffer]), 'xlsx');
      toast.success("XLSX generated locally!", { id: toastId });
    } catch (e) { toast.error("XLSX generation failed.", { id: toastId }); }
    finally { setIsGenerating(false); }
  };

  const generatePpt = async () => {
    setIsGenerating(true);
    const toastId = toast.loading("Generating Microsoft PowerPoint native conversion...");
    try {
      let pres = new pptxgen();
      pptSlides.forEach(slideData => {
        let slide = pres.addSlide();
        slide.background = { fill: slideData.bgColor };
        // PPT title
        slide.addText(slideData.title, { x: 0.5, y: 0.5, w: '90%', h: 1, fontSize: 36, bold: true, color: slideData.bgColor === "#FFFFFF" ? "000000" : "FFFFFF", align: pres.AlignH.center });
        // PPT content
        slide.addText(slideData.text, { x: 0.5, y: 2, w: '90%', h: 3, fontSize: 18, color: slideData.bgColor === "#FFFFFF" ? "000000" : "FFFFFF", align: pres.AlignH.left, valign: pres.AlignV.top });
      });
      const outBuffer = await pres.write({ outputType: 'arraybuffer' });
      triggerDownload(new Blob([outBuffer]), 'pptx');
      toast.success("PPTX generated locally!", { id: toastId });
    } catch (e) { toast.error("PPTX generation failed.", { id: toastId }); }
    finally { setIsGenerating(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-darkCard p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl min-h-[600px] flex flex-col">
      <div className="flex items-center gap-3 mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
        <Zap className="text-primary w-8 h-8" />
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">Microsoft Office Pro Automation Suite</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Pure native conversion through SDKs without third-party heavy dependency.</p>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl mb-8 border border-slate-200 dark:border-slate-700">
        {[{ id: 'word', icon: Type, name: 'Word Gen' }, { id: 'excel', icon: Table, name: 'Excel Sheets' }, { id: 'ppt', icon: Presentation, name: 'PPT Slides' }].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-lg font-bold text-sm transition-colors ${isActive ? 'bg-primary text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'}`}>
              <Icon size={18} />
              {tab.name}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto space-y-6">
        {activeTab === 'word' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <input type="text" value={wordData.title} onChange={e => setWordData({ ...wordData, title: e.target.value })} placeholder="Document Title" className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-darkCard text-lg font-bold" />
            <input type="text" value={wordData.subtitle} onChange={e => setWordData({ ...wordData, subtitle: e.target.value })} placeholder="Document Subtitle" className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-darkCard" />
            <textarea value={wordData.content} onChange={e => setWordData({ ...wordData, content: e.target.value })} placeholder="Add your content here..." rows={10} className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 resize-none" />
            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
              <button onClick={generateWord} disabled={isGenerating} className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700">
                {isGenerating ? <Loader2 className="animate-spin" /> : <FileDown />} Generate DOCX
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'excel' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-slate-700 dark:text-slate-300">Native Excel Reporting</h4>
              <button onClick={addExcelRow} className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-sm bg-primary text-white">
                <Plus size={16} /> Add Row
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    {['Name', 'Role', 'Status', 'Action'].map(header => <th key={header} className="text-left p-4 font-bold text-slate-700 dark:text-slate-300">{header}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {excelRows.map(row => (
                    <tr key={row.id}>
                      <td className="p-3"><input type="text" value={row.name} onChange={e => handleExcelInputChange(row.id, 'name', e.target.value)} className="w-full bg-transparent p-1 outline-none" /></td>
                      <td className="p-3"><input type="text" value={row.role} onChange={e => handleExcelInputChange(row.id, 'role', e.target.value)} className="w-full bg-transparent p-1 outline-none" /></td>
                      <td className="p-3"><input type="text" value={row.status} onChange={e => handleExcelInputChange(row.id, 'status', e.target.value)} className="w-full bg-transparent p-1 outline-none" /></td>
                      <td className="p-3"><button onClick={() => removeExcelRow(row.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
              <button onClick={generateExcel} disabled={isGenerating} className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700">
                {isGenerating ? <Loader2 className="animate-spin" /> : <FileDown />} Generate XLSX
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'ppt' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h4 className="font-bold text-slate-700 dark:text-slate-300">Microsoft PPT Presentation Builder</h4>
            {pptSlides.map((slide, idx) => (
                <div key={slide.id} className="p-5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 relative">
                    <span className="absolute top-2 right-3 text-xs font-bold text-slate-400">Slide {idx+1}</span>
                    <input type="text" value={slide.title} onChange={e => setPptSlides(pptSlides.map(s => s.id === slide.id ? {...s, title: e.target.value} : s))} placeholder="Slide Title" className="w-full bg-transparent font-bold outline-none border-b border-slate-300 dark:border-slate-600 pb-2"/>
                    <textarea value={slide.text} onChange={e => setPptSlides(pptSlides.map(s => s.id === slide.id ? {...s, text: e.target.value} : s))} placeholder="Slide body content..." rows={4} className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-darkCard resize-none text-sm"/>
                    <div className='flex items-center gap-3'>
                        <label className='text-xs font-semibold'>Bg Color:</label>
                        <input type="color" value={slide.bgColor} onChange={e => setPptSlides(pptSlides.map(s => s.id === slide.id ? {...s, bgColor: e.target.value} : s))} className='h-8 w-16 border-none cursor-pointer'/>
                        <button onClick={() => setPptSlides(pptSlides.filter(s => s.id !== slide.id))} className="text-red-500 hover:text-red-700 text-xs ml-auto"><Trash2 size={16} /> Remove</button>
                    </div>
                </div>
            ))}
            <button onClick={() => setPptSlides([...pptSlides, {id: Date.now(), title: "New Slide", text: "New Content", bgColor: "#FFFFFF"}])} className="w-full py-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-primary hover:border-primary font-bold text-sm">Add New Slide</button>
            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
              <button onClick={generatePpt} disabled={isGenerating} className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-700">
                {isGenerating ? <Loader2 className="animate-spin" /> : <FileDown />} Generate PPTX
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
