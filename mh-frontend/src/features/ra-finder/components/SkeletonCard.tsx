import { Card, CardHeader } from "@/components/ui/card";

export function SkeletonCard() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-9 h-9 bg-gray-200 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-6 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
          <div className="h-16 w-24 bg-gray-200 rounded-lg" />
        </div>
        <div className="space-y-2 mt-4">
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
        </div>
        <div className="flex gap-2 mt-4">
          <div className="h-7 w-24 bg-gray-200 rounded-full" />
          <div className="h-7 w-28 bg-gray-200 rounded-full" />
          <div className="h-7 w-32 bg-gray-200 rounded-full" />
        </div>
      </CardHeader>
    </Card>
  );
}
