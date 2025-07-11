"use client";

import { useState, useEffect } from "react";
import { Search, X, Filter, SortAsc, SortDesc } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataProcessor, type SortOptions, type FilterOptions } from "@/lib/data-processor";

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  images: any[];
  onFilteredResults: (filteredImages: any[]) => void;
  showConfidenceFilter?: boolean;
}

const SearchBar = ({ 
  searchTerm, 
  onSearchChange, 
  images, 
  onFilteredResults,
  showConfidenceFilter = false 
}: SearchBarProps) => {
  const [sortField, setSortField] = useState<'name' | 'confidence' | 'date'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [minConfidence, setMinConfidence] = useState<number>(0);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Apply filters and sorting
  const applyFiltersAndSort = () => {
    let processed = [...images];

    // Apply search filter
    if (searchTerm) {
      processed = DataProcessor.filterImages(processed, {
        searchTerm: searchTerm
      });
    }

    // Apply confidence filter if enabled
    if (showConfidenceFilter && minConfidence > 0) {
      processed = DataProcessor.filterImages(processed, {
        minConfidence: minConfidence
      });
    }

    // Apply sorting
    processed = DataProcessor.sortImages(processed, {
      field: sortField,
      direction: sortDirection
    });

    onFilteredResults(processed);
  };

  // Handle sort change
  const handleSortChange = (field: 'name' | 'confidence' | 'date') => {
    if (field === sortField) {
      // Toggle direction if same field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Apply filters whenever dependencies change
  useEffect(() => {
    applyFiltersAndSort();
  }, [searchTerm, sortField, sortDirection, minConfidence, images]);

  return (
    <Card className="border border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Search & Filter Photos
            </CardTitle>
            <CardDescription>
              Filter and sort photos with advanced options
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search photos by name, date, or keywords..."
            className="pl-9"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          {searchTerm && (
            <Button 
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => onSearchChange('')}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="space-y-4 pt-4 border-t">
            {/* Sort Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <div className="flex gap-2">
                  <Button
                    variant={sortField === 'name' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSortChange('name')}
                    className="flex-1"
                  >
                    Name
                    {sortField === 'name' && (
                      sortDirection === 'asc' ? 
                        <SortAsc className="w-3 h-3 ml-1" /> : 
                        <SortDesc className="w-3 h-3 ml-1" />
                    )}
                  </Button>
                  <Button
                    variant={sortField === 'date' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSortChange('date')}
                    className="flex-1"
                  >
                    Date
                    {sortField === 'date' && (
                      sortDirection === 'asc' ? 
                        <SortAsc className="w-3 h-3 ml-1" /> : 
                        <SortDesc className="w-3 h-3 ml-1" />
                    )}
                  </Button>
                  {showConfidenceFilter && (
                    <Button
                      variant={sortField === 'confidence' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleSortChange('confidence')}
                      className="flex-1"
                    >
                      Confidence
                      {sortField === 'confidence' && (
                        sortDirection === 'asc' ? 
                          <SortAsc className="w-3 h-3 ml-1" /> : 
                          <SortDesc className="w-3 h-3 ml-1" />
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Confidence Filter */}
              {showConfidenceFilter && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Min Confidence: {minConfidence}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={minConfidence}
                    onChange={(e) => setMinConfidence(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              )}

              {/* Quick Filters */}
              <div>
                <label className="text-sm font-medium mb-2 block">Quick Actions</label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onSearchChange('');
                      setMinConfidence(0);
                      setSortField('name');
                      setSortDirection('asc');
                    }}
                  >
                    Reset
                  </Button>
                  {showConfidenceFilter && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMinConfidence(80)}
                    >
                      High Confidence
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
              <span>
                Showing {images.length} result{images.length !== 1 ? 's' : ''}
              </span>
              {showConfidenceFilter && minConfidence > 0 && (
                <span>
                  Filtered by {minConfidence}%+ confidence
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SearchBar;
