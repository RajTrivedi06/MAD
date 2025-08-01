import { useState } from "react";
import {
  CheckCircle,
  Calendar,
  MessageSquare,
  Edit3,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ApplicationStatus } from "../types/labMatch";

interface ApplicationTrackerProps {
  labId: string;
  status: ApplicationStatus;
  onMarkAsApplied: (labId: string, notes?: string) => void;
  onMarkResponseReceived: (labId: string, notes?: string) => void;
  onUpdateNotes: (labId: string, notes: string) => void;
  onRemoveApplication: (labId: string) => void;
}

export function ApplicationTracker({
  labId,
  status,
  onMarkAsApplied,
  onMarkResponseReceived,
  onUpdateNotes,
  onRemoveApplication,
}: ApplicationTrackerProps) {
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [notes, setNotes] = useState(status.notes || "");

  const handleSaveNotes = () => {
    onUpdateNotes(labId, notes);
    setShowNotesInput(false);
  };

  const formatDate = (date?: Date) => {
    if (!date) return "";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const getStatusBadge = () => {
    if (status.responseReceived) {
      return (
        <Badge className="bg-green-100 text-green-800">Response Received</Badge>
      );
    }
    if (status.applied) {
      return <Badge className="bg-blue-100 text-blue-800">Applied</Badge>;
    }
    return <Badge variant="secondary">Not Applied</Badge>;
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <div className="flex items-center justify-between mb-3">
        <h5 className="font-medium text-blue-900 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Application Status
        </h5>
        {getStatusBadge()}
      </div>

      {status.applied ? (
        <div className="space-y-3">
          <div className="text-sm text-blue-800 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Applied on: {formatDate(status.appliedDate)}</span>
          </div>

          <div className="flex gap-2">
            {!status.responseReceived && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMarkResponseReceived(labId)}
                className="text-green-600 border-green-600 hover:bg-green-50"
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                Mark Response
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNotesInput(!showNotesInput)}
              className="text-gray-600 border-gray-600 hover:bg-gray-50"
            >
              <Edit3 className="w-4 h-4 mr-1" />
              {status.notes ? "Edit Notes" : "Add Notes"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onRemoveApplication(labId)}
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Remove
            </Button>
          </div>

          {showNotesInput && (
            <div className="space-y-2">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about your application..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                rows={3}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveNotes}>
                  Save Notes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNotesInput(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {status.notes && !showNotesInput && (
            <div className="bg-white/60 rounded-md p-3 text-sm text-gray-700">
              <strong>Notes:</strong> {status.notes}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-blue-700">
            Track your application progress by marking when you apply.
          </p>
          <Button
            onClick={() => onMarkAsApplied(labId)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark as Applied
          </Button>
        </div>
      )}
    </Card>
  );
}
