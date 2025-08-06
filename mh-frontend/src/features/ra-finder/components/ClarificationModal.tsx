import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ClarifyingQuestion {
  question: string;
  context: string;
}

interface ClarificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: ClarifyingQuestion[];
  onSubmit: (answers: Record<string, string>) => void;
  loading?: boolean;
}

export const ClarificationModal: React.FC<ClarificationModalProps> = ({
  isOpen,
  onClose,
  questions,
  onSubmit,
  loading = false,
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const handleAnswerChange = (question: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [question]: answer }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    // Only submit answers that have been filled
    const filledAnswers = Object.fromEntries(
      Object.entries(answers).filter(([, value]) => value.trim())
    );
    onSubmit(filledAnswers);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  // Check if all questions have been answered
  const allAnswered = questions.every((q) => answers[q.question]?.trim());

  // Check if user can submit (at least one answer provided)
  const canSubmit = Object.values(answers).some((a) => a.trim());

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <Card className="w-full max-w-2xl bg-gradient-to-br from-gray-900 to-gray-800 text-white border-gray-700 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-red-500/20 to-red-600/20">
                    <Sparkles className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      Help Us Find Your Perfect Match
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                      Answer a few questions to personalize your results
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Progress indicator */}
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                    <span>
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </span>
                    <span>
                      {Math.round(
                        ((currentQuestionIndex + 1) / questions.length) * 100
                      )}
                      % Complete
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-red-500 to-red-600"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${
                          ((currentQuestionIndex + 1) / questions.length) * 100
                        }%`,
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                {/* Current Question */}
                <motion.div
                  key={currentQuestionIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <label className="text-lg font-medium text-white mb-3 block">
                    {currentQuestion.question}
                  </label>
                  {currentQuestion.context && (
                    <p className="text-sm text-gray-400 mb-4">
                      {currentQuestion.context}
                    </p>
                  )}
                  <textarea
                    value={answers[currentQuestion.question] || ""}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      handleAnswerChange(
                        currentQuestion.question,
                        e.target.value
                      )
                    }
                    placeholder="Type your answer here..."
                    className="w-full min-h-[120px] p-3 rounded-md bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:border-red-400 focus:ring-1 focus:ring-red-400 focus:outline-none resize-y"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Tip: Be specific to get better matches. You can skip
                    questions if unsure.
                  </p>
                </motion.div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-gray-700">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={handlePrevious}
                    disabled={isFirstQuestion || loading}
                    className="text-gray-300 hover:text-white hover:bg-gray-700"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={onClose}
                    disabled={loading}
                    className="text-gray-300 hover:text-white hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                </div>

                <div className="flex gap-2">
                  {!isLastQuestion ? (
                    <Button
                      onClick={handleNext}
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Next
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={handleSubmit}
                        disabled={!canSubmit || loading}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        Skip Remaining & Search
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={!allAnswered || loading}
                        className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                      >
                        {loading ? "Searching..." : "Find My Matches"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
