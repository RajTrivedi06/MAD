import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, XCircle, Sparkles } from "lucide-react";

interface ProgressToastProps {
  message: string;
  isVisible: boolean;
  type?: "loading" | "success" | "error";
}

export const ProgressToast: React.FC<ProgressToastProps> = ({
  message,
  isVisible,
  type = "loading",
}) => {
  const getIcon = () => {
    switch (type) {
      case "loading":
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case "success":
        return <CheckCircle2 className="w-4 h-4" />;
      case "error":
        return <XCircle className="w-4 h-4" />;
    }
  };

  const getColorClasses = () => {
    switch (type) {
      case "loading":
        return "bg-gray-800 border-gray-700 text-gray-100";
      case "success":
        return "bg-green-900/90 border-green-800 text-green-100";
      case "error":
        return "bg-red-900/90 border-red-800 text-red-100";
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-sm ${getColorClasses()}`}
          >
            <div className="flex-shrink-0">{getIcon()}</div>
            <p className="text-sm font-medium">{message}</p>
            {type === "loading" && (
              <Sparkles className="w-4 h-4 text-red-400 animate-pulse" />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
