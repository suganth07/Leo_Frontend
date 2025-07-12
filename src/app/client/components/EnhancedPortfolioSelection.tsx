"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FolderOpen, CheckCircle2, Search, ChevronDown, Filter, Calendar, Hash, Type, SortAsc, SortDesc } from "lucide-react";

interface EnhancedPortfolioSelectionProps {
  folders: { id: string; name: string; created_date?: string; photo_count?: number }[];
  selectedFolderId: string;
  onFolderChange: (value: string) => void;
  isLoading?: boolean;
}

type SortField = 'name' | 'created_date' | 'photo_count';
type SortDirection = 'asc' | 'desc';

const EnhancedPortfolioSelection = ({ 
  folders, 
  selectedFolderId, 
  onFolderChange,
  isLoading = false
}: EnhancedPortfolioSelectionProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Enhanced filtering and sorting
  const filteredAndSortedFolders = useMemo(() => {
    let filtered = folders;
    
    // Apply search filter
    if (searchTerm.trim()) {
      filtered = folders.filter(folder => 
        folder.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply sorting
    return filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'created_date':
          aValue = new Date(a.created_date || 0);
          bValue = new Date(b.created_date || 0);
          break;
        case 'photo_count':
          aValue = a.photo_count || 0;
          bValue = b.photo_count || 0;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [folders, searchTerm, sortField, sortDirection]);

  const selectedFolder = folders.find(f => f.id === selectedFolderId);

  const handleSelectFolder = (folderId: string) => {
    onFolderChange(folderId);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleSortChange = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!event.target) return;
      const target = event.target as Element;
      if (!target.closest('[data-portfolio-dropdown]')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card className="border border-border/60" style={{ overflow: 'visible' }}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <FolderOpen className="h-4 w-4 text-primary" />
          Select Portfolio
        </CardTitle>
        <CardDescription className="text-xs">
          Choose your photo collection with advanced filtering
        </CardDescription>
      </CardHeader>
      <CardContent style={{ overflow: 'visible' }}>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="portfolio-select" className="text-xs">Active Portfolio</Label>
            
            {/* Searchable Dropdown */}
            <div className="relative overflow-visible" data-portfolio-dropdown>
              <Button
                variant="outline"
                className="w-full justify-between h-9 text-xs"
                onClick={() => setIsOpen(!isOpen)}
                disabled={isLoading}
              >
                <span className="truncate flex items-center gap-2">
                  {isLoading ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border border-primary border-t-transparent" />
                      Loading portfolios...
                    </>
                  ) : selectedFolder ? (
                    selectedFolder.name
                  ) : (
                    "Choose portfolio..."
                  )}
                </span>
                <ChevronDown className={`ml-2 h-3 w-3 shrink-0 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </Button>
              
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-[9999] w-full mt-1 bg-background border rounded-md shadow-lg"
                    style={{ position: 'absolute', top: '100%', left: 0, right: 0 }}
                  >
                    {/* Search and Filter Controls */}
                    <div className="p-3 border-b space-y-3">
                      {/* Search Input */}
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <Input
                          placeholder="Search portfolios..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-7 h-8 text-xs"
                          autoFocus
                        />
                      </div>
                      
                      {/* Filter Toggle */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                        className="w-full h-6 text-xs"
                      >
                        <Filter className="w-3 h-3 mr-1" />
                        {showFilters ? 'Hide' : 'Show'} Filters
                      </Button>
                      
                      {/* Advanced Filters */}
                      <AnimatePresence>
                        {showFilters && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2"
                          >
                            <div className="text-xs font-medium text-muted-foreground">Sort By:</div>
                            <div className="grid grid-cols-3 gap-1">
                              <Button
                                variant={sortField === 'name' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleSortChange('name')}
                                className="h-6 text-xs px-2"
                              >
                                <Type className="w-2 h-2 mr-1" />
                                Name
                                {sortField === 'name' && (
                                  sortDirection === 'asc' ? 
                                    <SortAsc className="w-2 h-2 ml-1" /> : 
                                    <SortDesc className="w-2 h-2 ml-1" />
                                )}
                              </Button>
                              <Button
                                variant={sortField === 'created_date' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleSortChange('created_date')}
                                className="h-6 text-xs px-2"
                              >
                                <Calendar className="w-2 h-2 mr-1" />
                                Date
                                {sortField === 'created_date' && (
                                  sortDirection === 'asc' ? 
                                    <SortAsc className="w-2 h-2 ml-1" /> : 
                                    <SortDesc className="w-2 h-2 ml-1" />
                                )}
                              </Button>
                              <Button
                                variant={sortField === 'photo_count' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleSortChange('photo_count')}
                                className="h-6 text-xs px-2"
                              >
                                <Hash className="w-2 h-2 mr-1" />
                                Photos
                                {sortField === 'photo_count' && (
                                  sortDirection === 'asc' ? 
                                    <SortAsc className="w-2 h-2 ml-1" /> : 
                                    <SortDesc className="w-2 h-2 ml-1" />
                                )}
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    {/* Portfolio List */}
                    <div className="max-h-48 overflow-auto scrollbar-hide">
                      {filteredAndSortedFolders.length > 0 ? (
                        filteredAndSortedFolders.map((folder) => (
                          <div
                            key={folder.id}
                            className="flex cursor-pointer select-none items-center justify-between rounded-sm px-3 py-2 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
                            onClick={() => handleSelectFolder(folder.id)}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="truncate font-medium">{folder.name}</span>
                                {selectedFolderId === folder.id && (
                                  <CheckCircle2 className="h-3 w-3 text-primary flex-shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-muted-foreground mt-0.5">
                                {folder.created_date && (
                                  <span>{formatDate(folder.created_date)}</span>
                                )}
                                {folder.photo_count !== undefined && (
                                  <span>{folder.photo_count} photos</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-4 text-center text-xs text-muted-foreground">
                          {searchTerm ? "No portfolios found" : "No portfolios available"}
                        </div>
                      )}
                    </div>
                    
                    {/* Results Summary */}
                    {(searchTerm || showFilters) && (
                      <div className="p-2 border-t text-xs text-muted-foreground bg-muted/30">
                        {filteredAndSortedFolders.length} of {folders.length} portfolio(s) shown
                        {sortField !== 'name' && (
                          <span className="ml-2">• Sorted by {sortField}</span>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          {selectedFolderId && (
            <div className="flex items-center gap-2 text-xs text-green-600">
              <CheckCircle2 className="w-3 h-3" />
              <span>Portfolio selected</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedPortfolioSelection;
