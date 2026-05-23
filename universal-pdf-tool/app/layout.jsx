import "./globals.css";
import ToastProvider from "../components/ui/ToastProvider";
import { Layers } from "lucide-react";

export const metadata = {
  title: "Universal PDF & File Converter | Advanced Editor",
  description: "The ultimate tool to convert, merge, compress, edit, and chat with your PDFs.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="light">
      <body className="antialiased min-h-screen flex flex-col bg-slate-50 dark:bg-darkBg text-slate-900 dark:text-slate-100 transition-colors duration-300">
        <ToastProvider />
        
        {/* Navigation / Header */}
        <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 dark:bg-darkCard/80 border-b border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-primary p-2 rounded-lg text-white">
                <Layers size={24} />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-slate-800 dark:text-white">
                Universal<span className="text-primary">PDF</span>
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline-block text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 px-3 py-1.5 rounded-full">
                Pro Edition
              </span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="w-full py-6 mt-auto bg-white dark:bg-darkCard border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              © 2026 Powered by Suhel(AI) Technology. All rights reserved.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Client-side Processing • Secure • Fast
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
