"use client";

import { useState, useEffect } from "react";
import { Search, X, Filter, SortAsc, SortDesc, Calendar, Hash, Type } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AdminSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  images: any[];
  onFilteredResults: (filteredImages: any[]) => void;
}

const AdminSearchBar = ({ 
  searchTerm, 
  onSearchChange, 
  images, 
  onFilteredResults
}: AdminSearchBarProps) => {
  const [sortField, setSortField] = useState<'name' | 'date'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Apply filters and sorting
  const applyFiltersAndSort = () => {
    let processed = [...images];

    // Apply search filter
    if (searchTerm) {
      processed = processed.filter(image => 
        image.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    processed = processed.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'date':
          // Assuming images have a date property or we can extract from name
          aValue = a.name;
          bValue = b.name;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    onFilteredResults(processed);
  };

  // Handle sort change
  const handleSortChange = (field: 'name' | 'date') => {
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
  }, [searchTerm, sortField, sortDirection, images]);

  return (
    <Card className="border border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Search & Filter Images
            </CardTitle>
            <CardDescription>
              Search and sort images with advanced options
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="bg-primary/5 hover:bg-primary/10 border-primary/20"
          >
            <Filter className={`w-4 h-4 mr-2 ${showAdvancedFilters ? 'text-primary' : ''}`} />
            <span className={showAdvancedFilters ? 'text-primary font-medium' : ''}>
              {showAdvancedFilters ? 'Hide Filters' : 'Show Filters'}
            </span>
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
            placeholder="Search images by name..."
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <div className="flex gap-2">
                  <Button
                    variant={sortField === 'name' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSortChange('name')}
                    className="flex-1"
                  >
                    <Type className="w-3 h-3 mr-1" />
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
                    <Calendar className="w-3 h-3 mr-1" />
                    Date
                    {sortField === 'date' && (
                      sortDirection === 'asc' ? 
                        <SortAsc className="w-3 h-3 ml-1" /> : 
                        <SortDesc className="w-3 h-3 ml-1" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <label className="text-sm font-medium mb-2 block">Quick Actions</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onSearchChange('');
                    setSortField('name');
                    setSortDirection('asc');
                  }}
                  className="w-full"
                >
                  Reset All Filters
                </Button>
              </div>
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
              <span>
                Showing {images.length} image{images.length !== 1 ? 's' : ''}
              </span>
              <span>
                Sorted by {sortField} ({sortDirection === 'asc' ? 'ascending' : 'descending'})
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminSearchBar;
