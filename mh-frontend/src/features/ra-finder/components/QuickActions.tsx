import { useState } from "react";
import {
  Plus,
  Printer,
  Download,
  Share2,
  Heart,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { LabMatch } from "../types/labMatch";

interface QuickActionsProps {
  matches: LabMatch[];
  savedCount: number;
  appliedCount: number;
  onShowSavedLabs?: () => void;
  onShowStats?: () => void;
}

export function QuickActions({
  matches,
  savedCount,
  onShowSavedLabs,
  onShowStats,
}: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const exportToCSV = () => {
    const headers = [
      "Lab Title",
      "PI Name",
      "Department",
      "Match Score",
      "Openings",
      "Research Areas",
    ];
    const csvData = matches.map((match) => [
      match.labTitle,
      match.piName,
      match.department,
      match.fitScore.toString(),
      match.openings ? "Yes" : "No",
      match.researchAreas.join("; "),
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ra-finder-results.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  const shareResults = async () => {
    const text = `I found ${matches.length} research opportunities that match my interests! Check out the RA Finder tool.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "RA Finder Results",
          text,
          url: window.location.href,
        });
      } catch {
        console.log("Share cancelled");
      }
    } else {
      // Fallback to copying to clipboard
      await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
      alert("Results copied to clipboard!");
    }
    setIsOpen(false);
  };

  const printResults = () => {
    window.print();
    setIsOpen(false);
  };

  const actions = [
    {
      icon: Heart,
      label: `Saved Labs (${savedCount})`,
      onClick: onShowSavedLabs,
      color: "text-pink-600 hover:text-pink-700",
      disabled: savedCount === 0,
    },
    {
      icon: BarChart3,
      label: "View Statistics",
      onClick: onShowStats,
      color: "text-purple-600 hover:text-purple-700",
    },
    {
      icon: Download,
      label: "Export as CSV",
      onClick: exportToCSV,
      color: "text-green-600 hover:text-green-700",
      disabled: matches.length === 0,
    },
    {
      icon: Share2,
      label: "Share Results",
      onClick: shareResults,
      color: "text-blue-600 hover:text-blue-700",
      disabled: matches.length === 0,
    },
    {
      icon: Printer,
      label: "Print Results",
      onClick: printResults,
      color: "text-gray-600 hover:text-gray-700",
      disabled: matches.length === 0,
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4"
          >
            <Card className="p-2 shadow-lg border-gray-200 min-w-48">
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.label}
                    variant="ghost"
                    size="sm"
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className={`w-full justify-start gap-2 h-10 ${
                      action.color
                    } ${
                      action.disabled ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {action.label}
                  </Button>
                );
              })}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        size="lg"
        onClick={() => setIsOpen(!isOpen)}
        className={`rounded-full w-14 h-14 shadow-lg transition-all duration-200 ${
          isOpen
            ? "bg-gray-600 hover:bg-gray-700 rotate-45"
            : "bg-red-600 hover:bg-red-700"
        }`}
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
}
