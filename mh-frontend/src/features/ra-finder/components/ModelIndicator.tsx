import React from "react";

interface ModelIndicatorProps {
  model: string | null;
  className?: string;
}

export const ModelIndicator: React.FC<ModelIndicatorProps> = ({
  model,
  className = "",
}) => {
  if (!model) return null;

  const getModelInfo = (model: string) => {
    switch (model) {
      case "o4-mini-deep-research":
        return {
          label: "🚀 Advanced AI",
          description: "OpenAI o4-mini-deep-research with web search",
          className:
            "bg-green-100 text-green-800 border-green-200 hover:bg-green-50",
        };
      case "gpt-4o":
        return {
          label: "🧠 Standard AI",
          description: "OpenAI GPT-4o fallback mode",
          className:
            "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-50",
        };
      case "fallback-mock":
        return {
          label: "📊 Sample Data",
          description: "Using demo data (AI unavailable)",
          className:
            "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-50",
        };
      default:
        return {
          label: `🤖 AI (${model})`,
          description: `Generated using ${model}`,
          className:
            "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-50",
        };
    }
  };

  const modelInfo = getModelInfo(model);

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium border transition-colors cursor-help ${modelInfo.className}`}
        title={modelInfo.description}
      >
        {modelInfo.label}
      </span>
    </div>
  );
};
