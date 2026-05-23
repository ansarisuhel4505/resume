"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Loader2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function AiPdfChat({ files }) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [pdfText, setPdfText] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isTyping]);

  // Step 1: Extract Text from PDF
  const handleExtractText = async () => {
    if (files.length === 0) {
      toast.error("Please upload a PDF first.");
      return;
    }

    const file = files[0];
    if (file.type !== 'application/pdf') {
      toast.error("AI Chat currently supports PDF files only.");
      return;
    }

    setIsExtracting(true);
    const toastId = toast.loading("Reading PDF content...");

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('targetFormat', 'txt');

      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to read PDF text.");
      }

      const text = await response.text();
      
      if (!text || text.trim().length === 0) {
        throw new Error("Could not find any readable text in this PDF.");
      }

      setPdfText(text);
      setChatHistory([
        { role: 'ai', content: `Hello! I have read "${file.name}". You can now ask me to summarize it or ask any specific questions about its content.` }
      ]);
      toast.success("PDF read successfully! You can start chatting.", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error(error.message, { id: toastId });
    } finally {
      setIsExtracting(false);
    }
  };

  // Step 2: Send Question to AI
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!currentPrompt.trim() || !pdfText) return;

    const userMessage = currentPrompt.trim();
    setCurrentPrompt("");
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMessage,
          pdfText: pdfText.substring(0, 15000) // Send first 15k chars to avoid token limits
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get AI response.");
      }

      setChatHistory(prev => [...prev, { role: 'ai', content: data.reply }]);
    } catch (error) {
      console.error(error);
      toast.error(error.message);
      setChatHistory(prev => [...prev, { role: 'ai', content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  // UI State 1: Need to extract text first
  if (!pdfText) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700"
      >
        <Bot className="text-indigo-500 w-12 h-12 mb-4" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 truncate max-w-xs text-center">
          Initialize AI Chat: {files[0]?.name}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-sm mb-6">
          Before we can chat, the AI needs to read and process the text inside your PDF document.
        </p>
        <button
          onClick={handleExtractText}
          disabled={isExtracting}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all shadow-md ${
            isExtracting
              ? 'bg-indigo-400 cursor-not-allowed opacity-70'
              : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 hover:shadow-lg'
          }`}
        >
          {isExtracting ? (
            <>
              <Loader2 className="animate-spin" size={20} /> Reading PDF...
            </>
          ) : (
            <>
              <FileText size={20} /> Process PDF Data
            </>
          )}
        </button>
      </motion.div>
    );
  }

  // UI State 2: Chat Interface
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-6 flex flex-col w-full h-[500px] bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm"
    >
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800/50">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-100 dark:bg-indigo-800 p-1.5 rounded-lg text-indigo-600 dark:text-indigo-300">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Document Assistant</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{files[0]?.name}</p>
          </div>
        </div>
        <button 
          onClick={() => setPdfText("")}
          className="text-xs font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
        >
          Reset Chat
        </button>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/30">
        {chatHistory.map((msg, index) => (
          <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'ai' && (
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                <Bot size={16} className="text-indigo-600 dark:text-indigo-400" />
              </div>
            )}
            
            <div className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-sm ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-sm' 
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-sm'
            }`}>
              {msg.content}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                <User size={16} className="text-slate-600 dark:text-slate-300" />
              </div>
            )}
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
              <Bot size={16} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-tl-sm flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Chat Input Area */}
      <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-darkCard border-t border-slate-200 dark:border-slate-700 flex gap-2">
        <input
          type="text"
          value={currentPrompt}
          onChange={(e) => setCurrentPrompt(e.target.value)}
          placeholder="Ask a question about your document..."
          disabled={isTyping}
          className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-800 dark:text-slate-100 text-sm"
        />
        <button
          type="submit"
          disabled={!currentPrompt.trim() || isTyping}
          className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 disabled:dark:bg-slate-700 transition-colors"
        >
          <Send size={18} />
        </button>
      </form>
    </motion.div>
  );
}
