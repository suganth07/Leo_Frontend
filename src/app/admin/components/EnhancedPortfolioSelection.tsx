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
  selectedPortfolioId: string;
  setSelectedPortfolioId: (value: string) => void;
}

type SortField = 'name' | 'created_date' | 'photo_count';
type SortDirection = 'asc' | 'desc';

const EnhancedAdminPortfolioSelection = ({ 
  folders, 
  selectedPortfolioId, 
  setSelectedPortfolioId
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

  const selectedFolder = folders.find(f => f.id === selectedPortfolioId);

  const handleSelectFolder = (folderId: string) => {
    setSelectedPortfolioId(folderId);
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
      if (!target.closest('[data-admin-portfolio-dropdown]')) {
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
          Portfolio Management
        </CardTitle>
        <CardDescription className="text-xs">
          Select and manage your photo portfolios
        </CardDescription>
      </CardHeader>
      <CardContent style={{ overflow: 'visible' }}>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="admin-portfolio-select" className="text-xs">Active Portfolio</Label>
            
            {/* Searchable Dropdown */}
            <div className="relative overflow-visible" data-admin-portfolio-dropdown>
              <Button
                variant="outline"
                className="w-full justify-between h-10 text-sm"
                onClick={() => setIsOpen(!isOpen)}
              >
                <span className="truncate flex items-center gap-2">
                  {selectedFolder ? selectedFolder.name : "Choose portfolio..."}
                </span>
                <ChevronDown className={`ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search portfolios..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8 h-9 text-sm"
                          autoFocus
                        />
                      </div>
                      
                      {/* Filter Toggle */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                        className="w-full"
                      >
                        <Filter className="w-4 h-4 mr-2" />
                        {showFilters ? 'Hide' : 'Show'} Filters
                      </Button>
                      
                      {/* Advanced Filters */}
                      <AnimatePresence>
                        {showFilters && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3"
                          >
                            <div className="text-sm font-medium text-muted-foreground">Sort By:</div>
                            <div className="grid grid-cols-3 gap-2">
                              <Button
                                variant={sortField === 'name' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleSortChange('name')}
                                className="text-xs"
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
                                variant={sortField === 'created_date' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleSortChange('created_date')}
                                className="text-xs"
                              >
                                <Calendar className="w-3 h-3 mr-1" />
                                Date
                                {sortField === 'created_date' && (
                                  sortDirection === 'asc' ? 
                                    <SortAsc className="w-3 h-3 ml-1" /> : 
                                    <SortDesc className="w-3 h-3 ml-1" />
                                )}
                              </Button>
                              <Button
                                variant={sortField === 'photo_count' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleSortChange('photo_count')}
                                className="text-xs"
                              >
                                <Hash className="w-3 h-3 mr-1" />
                                Photos
                                {sortField === 'photo_count' && (
                                  sortDirection === 'asc' ? 
                                    <SortAsc className="w-3 h-3 ml-1" /> : 
                                    <SortDesc className="w-3 h-3 ml-1" />
                                )}
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    {/* Portfolio List */}
                    <div className="max-h-60 overflow-auto scrollbar-hide">
                      {filteredAndSortedFolders.length > 0 ? (
                        filteredAndSortedFolders.map((folder) => (
                          <div
                            key={folder.id}
                            className="flex cursor-pointer select-none items-center justify-between rounded-sm px-4 py-3 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
                            onClick={() => handleSelectFolder(folder.id)}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="truncate font-medium">{folder.name}</span>
                                {selectedPortfolioId === folder.id && (
                                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-muted-foreground text-xs mt-1">
                                {folder.created_date && (
                                  <span>Created: {formatDate(folder.created_date)}</span>
                                )}
                                {folder.photo_count !== undefined && (
                                  <span>{folder.photo_count} photos</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          {searchTerm ? "No portfolios found" : "No portfolios available"}
                        </div>
                      )}
                    </div>
                    
                    {/* Results Summary */}
                    {(searchTerm || showFilters) && (
                      <div className="p-3 border-t text-xs text-muted-foreground bg-muted/30">
                        Showing {filteredAndSortedFolders.length} of {folders.length} portfolio(s)
                        {sortField !== 'name' && (
                          <span className="ml-2">• Sorted by {sortField} ({sortDirection})</span>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          {selectedPortfolioId && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              <span>Portfolio selected</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedAdminPortfolioSelection;
