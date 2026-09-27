import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  isVisible: boolean;
  messages: string[];
}

export function LoadingOverlay({ isVisible, messages }: LoadingOverlayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setCurrentIndex(0);
      return;
    }
    
    // Cycle through messages, stopping at the last one
    const interval = setInterval(() => {
      setCurrentIndex((prev) => Math.min(prev + 1, messages.length - 1));
    }, 2500);
    
    return () => clearInterval(interval);
  }, [isVisible, messages.length]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white p-10 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4"
          >
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-primary-100 rounded-full animate-ping opacity-75"></div>
              <div className="relative bg-primary-50 text-primary-600 w-20 h-20 rounded-full flex items-center justify-center shadow-inner">
                <Loader2 className="w-10 h-10 animate-spin" />
              </div>
            </div>
            
            <div className="h-8 relative w-full flex justify-center items-center overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentIndex}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-lg font-display font-medium text-surface-900 absolute text-center w-full"
                >
                  {messages[currentIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
            
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-surface-100 rounded-full mt-6 overflow-hidden">
              <motion.div 
                className="h-full bg-primary-500 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${((currentIndex + 1) / messages.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
