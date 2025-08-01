import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FilterOptions } from "../types/labMatch";

interface FilterBarProps {
  onFilterChange: (filters: FilterOptions) => void;
  departments: string[];
  matchCount: number;
  activeFilters: FilterOptions;
}

export function FilterBar({
  onFilterChange,
  departments,
  matchCount,
  activeFilters,
}: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (newFilter: Partial<FilterOptions>) => {
    const updatedFilters = { ...activeFilters, ...newFilter };
    onFilterChange(updatedFilters);
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  const hasActiveFilters = Object.values(activeFilters).some(
    (value) => value !== undefined && value !== "all" && value !== ""
  );

  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-600 hover:text-gray-800"
            >
              <X className="w-4 h-4 mr-1" />
              Clear all
            </Button>
          )}

          <span className="text-sm text-gray-600">
            {matchCount} {matchCount === 1 ? "match" : "matches"} found
          </span>
        </div>

        {hasActiveFilters && (
          <div className="flex gap-2 flex-wrap">
            {activeFilters.department && activeFilters.department !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Department: {activeFilters.department}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => handleFilterChange({ department: undefined })}
                />
              </Badge>
            )}
            {activeFilters.minScore && activeFilters.minScore > 0 && (
              <Badge variant="secondary" className="gap-1">
                Min Score: {activeFilters.minScore}%
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => handleFilterChange({ minScore: 0 })}
                />
              </Badge>
            )}
            {activeFilters.openingsOnly && (
              <Badge variant="secondary" className="gap-1">
                Openings Only
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => handleFilterChange({ openingsOnly: false })}
                />
              </Badge>
            )}
          </div>
        )}
      </div>

      {showFilters && (
        <div className="border-t pt-4 space-y-4">
          {/* Department Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <select
              value={activeFilters.department || "all"}
              onChange={(e) =>
                handleFilterChange({
                  department:
                    e.target.value === "all" ? undefined : e.target.value,
                })
              }
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-600 focus:border-red-600"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Match Score Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Match Score: {activeFilters.minScore || 0}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={activeFilters.minScore || 0}
              onChange={(e) =>
                handleFilterChange({ minScore: parseInt(e.target.value) })
              }
              className="w-full max-w-xs"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1 max-w-xs">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Openings Filter */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={activeFilters.openingsOnly || false}
                onChange={(e) =>
                  handleFilterChange({ openingsOnly: e.target.checked })
                }
                className="rounded border-gray-300 text-red-600 focus:ring-red-600"
              />
              <span className="text-sm font-medium text-gray-700">
                Only show labs with openings
              </span>
            </label>
          </div>

          {/* Sort Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort by
            </label>
            <select
              value={activeFilters.sortBy || "score"}
              onChange={(e) =>
                handleFilterChange({
                  sortBy: e.target.value as FilterOptions["sortBy"],
                })
              }
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-600 focus:border-red-600"
            >
              <option value="score">Best Match First</option>
              <option value="newest">Recently Added</option>
              <option value="department">By Department</option>
            </select>
          </div>
        </div>
      )}
    </Card>
  );
}
