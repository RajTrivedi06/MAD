import { Heart, Send, MessageSquare, Target } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ProgressDashboardProps {
  matchCount: number;
  savedCount: number;
  appliedCount: number;
  responseCount: number;
}

export function ProgressDashboard({
  matchCount,
  savedCount,
  appliedCount,
  responseCount,
}: ProgressDashboardProps) {
  const stats = [
    {
      label: "Matches Found",
      value: matchCount,
      icon: Target,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      label: "Labs Saved",
      value: savedCount,
      icon: Heart,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
    {
      label: "Applications Sent",
      value: appliedCount,
      icon: Send,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Responses Received",
      value: responseCount,
      icon: MessageSquare,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ];

  return (
    <Card className="p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Your Research Journey
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="text-center">
              <div
                className={`w-12 h-12 ${stat.bgColor} rounded-full flex items-center justify-center mx-auto mb-2`}
              >
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className={`text-3xl font-bold ${stat.color} mb-1`}>
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {appliedCount > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Response Rate:</span>
            <span className="font-medium text-gray-900">
              {appliedCount > 0
                ? Math.round((responseCount / appliedCount) * 100)
                : 0}
              %
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${
                  appliedCount > 0 ? (responseCount / appliedCount) * 100 : 0
                }%`,
              }}
            />
          </div>
        </div>
      )}
    </Card>
  );
}
