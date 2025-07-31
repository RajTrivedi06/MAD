import { useState, useEffect, useCallback } from "react";
import { X, Copy, Mail, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LabMatch } from "../types/labMatch";
import { motion, AnimatePresence } from "framer-motion";

interface EmailTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: LabMatch;
  userProfile?: {
    name: string;
    major: string;
    year: string;
    skills: string[];
  };
}

export function EmailTemplateModal({
  isOpen,
  onClose,
  match,
  userProfile = {
    name: "[Your Name]",
    major: "[Your Major]",
    year: "[Your Year]",
    skills: ["Python", "Data Analysis", "Machine Learning"],
  },
}: EmailTemplateModalProps) {
  const [selectedSubject, setSelectedSubject] = useState(0);
  const [emailContent, setEmailContent] = useState("");
  const [copied, setCopied] = useState(false);

  const generateEmailContent = useCallback(() => {
    const template = `Dear Dr. ${match.piName.split(" ").pop()},

I am ${userProfile.name}, a ${userProfile.year} studying ${
      userProfile.major
    } at UW-Madison. I am writing to express my strong interest in joining your ${
      match.labTitle
    }.

${
  match.emailTemplateData?.personalizedHooks[0] ||
  "Your research aligns perfectly with my academic interests and career goals."
}

${
  match.emailTemplateData?.researchAlignment ||
  `I am particularly drawn to your work in ${match.researchAreas[0]} because of my experience with ${userProfile.skills[0]}.`
}

Key points about my background:
${
  match.emailTemplateData?.keyPoints.map((point) => `• ${point}`).join("\n") ||
  `• Relevant coursework in ${
    match.researchAreas[0]
  }\n• Experience with ${userProfile.skills.join(
    ", "
  )}\n• Strong interest in research`
}

I would be grateful for the opportunity to discuss how I could contribute to your research. I am available for a meeting at your convenience and have attached my CV for your review.

Thank you for considering my application.

Best regards,
${userProfile.name}
${userProfile.major}, ${userProfile.year}
[Your Phone Number]
[Your Email]`;

    setEmailContent(template);
  }, [match, userProfile]);

  useEffect(() => {
    if (isOpen && match.emailTemplateData) {
      generateEmailContent();
    }
  }, [isOpen, selectedSubject, generateEmailContent, match.emailTemplateData]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(emailContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Mail className="w-6 h-6 text-red-600" />
                  Email Template Generator
                </h2>
                <p className="text-gray-600 mt-1">
                  Personalized email template for {match.labTitle}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Subject Line Options */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Choose a Subject Line
              </h3>
              <div className="space-y-2">
                {match.emailTemplateData?.subjectSuggestions.map(
                  (subject, index) => (
                    <label
                      key={index}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedSubject === index
                          ? "border-red-600 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="subject"
                        checked={selectedSubject === index}
                        onChange={() => setSelectedSubject(index)}
                        className="mr-3 text-red-600"
                      />
                      <span className="text-gray-700">{subject}</span>
                    </label>
                  )
                )}
              </div>
            </div>

            {/* Email Template */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Email Template
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateEmailContent}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerate
                </Button>
              </div>
              <Card className="p-4 bg-gray-50 border-gray-200">
                <pre className="whitespace-pre-wrap font-sans text-gray-700 text-sm leading-relaxed">
                  {emailContent}
                </pre>
              </Card>
            </div>

            {/* Tips */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Pro Tips
              </h4>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• Attach your CV as a PDF with a clear filename</li>
                <li>• Send the email during business hours (9 AM - 5 PM)</li>
                <li>
                  • Follow up after one week if you don&apos;t receive a
                  response
                </li>
                <li>• Keep the email concise and professional</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Remember to personalize and proofread before sending
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={copyToClipboard}
                className="bg-red-600 hover:bg-red-700 text-white gap-2"
              >
                <Copy className="w-4 h-4" />
                {copied ? "Copied!" : "Copy to Clipboard"}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
