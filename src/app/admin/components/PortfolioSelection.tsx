"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FolderOpen, CheckCircle2, Search, ChevronDown } from "lucide-react";
import AddFolderDialog from "./AddFolderDialog";

interface PortfolioSelectionProps {
  folders: { id: string; name: string }[];
  selectedPortfolioId: string;
  setSelectedPortfolioId: (portfolioId: string) => void;
}

export default function PortfolioSelection({ 
  folders, 
  selectedPortfolioId, 
  setSelectedPortfolioId 
}: PortfolioSelectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [supabaseFolders, setSupabaseFolders] = useState<string[]>([]);
  const [showAddFolderDialog, setShowAddFolderDialog] = useState(false);
  const [pendingFolderSelection, setPendingFolderSelection] = useState<{id: string, name: string} | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter folders based on search term
  const filteredFolders = useMemo(() => {
    if (!searchTerm.trim()) return folders;
    return folders.filter(folder => 
      folder.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [folders, searchTerm]);

  const selectedFolder = folders.find(f => f.id === selectedPortfolioId);

  // Fetch Supabase folders on component mount
  useEffect(() => {
    fetchSupabaseFolders();
  }, []);

  const fetchSupabaseFolders = async () => {
    try {
      const response = await fetch('/api/admin/folders');
      if (response.ok) {
        const data = await response.json();
        const folderIds = data.folders.map((folder: { folder_id: string }) => folder.folder_id);
        console.log('Fetched Supabase folders:', folderIds);
        setSupabaseFolders(folderIds);
      } else {
        console.error('Failed to fetch Supabase folders:', response.status);
      }
    } catch (error) {
      console.error('Error fetching Supabase folders:', error);
    }
  };

  const handleSelectFolder = async (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    console.log('Selecting folder:', folderId);
    console.log('Supabase folders:', supabaseFolders);
    console.log('Folder exists in Supabase:', supabaseFolders.includes(folderId));

    // Check if folder exists in Supabase
    if (!supabaseFolders.includes(folderId)) {
      // Folder not in Supabase, show dialog
      console.log('Folder not found in Supabase, showing dialog');
      setPendingFolderSelection({ id: folderId, name: folder.name });
      setShowAddFolderDialog(true);
      setIsOpen(false);
      setSearchTerm("");
    } else {
      // Folder exists in Supabase, proceed normally
      console.log('Folder found in Supabase, proceeding normally');
      setSelectedPortfolioId(folderId);
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  const handleFolderAdded = async () => {
    // Refresh Supabase folders list
    await fetchSupabaseFolders();
    
    // Small delay to ensure state is updated
    setTimeout(() => {
      // If there was a pending selection, complete it now
      if (pendingFolderSelection) {
        setSelectedPortfolioId(pendingFolderSelection.id);
        setPendingFolderSelection(null);
      }
    }, 100);
  };

  const handleDialogClose = () => {
    setShowAddFolderDialog(false);
    setPendingFolderSelection(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <Card className="border border-border/60 mb-6" style={{ overflow: 'visible' }}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            Portfolio Selection
          </CardTitle>
          <CardDescription>
            Select a portfolio to enable advanced features and management
          </CardDescription>
        </CardHeader>
        <CardContent style={{ overflow: 'visible' }}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="portfolio-select">Active Portfolio</Label>
              
              {/* Searchable Dropdown */}
              <div className="relative overflow-visible" ref={dropdownRef}>
                <Button
                  variant="outline"
                  className="w-full justify-between h-10"
                  onClick={() => setIsOpen(!isOpen)}
                >
                  <span className="truncate">
                    {selectedFolder ? selectedFolder.name : "Select portfolio for enhanced features..."}
                  </span>
                  <ChevronDown className={`ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </Button>
                
                <AnimatePresence>
                  {isOpen && (              <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-[9999] w-full mt-1 bg-background border rounded-md shadow-lg"
                  style={{ position: 'absolute', top: '100%', left: 0, right: 0 }}
                >
                      <div className="p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search portfolios..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 h-9"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-auto scrollbar-hide">
                        {filteredFolders.length > 0 ? (
                          filteredFolders.map((folder) => (
                            <div
                              key={folder.id}
                              className="flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
                              onClick={() => handleSelectFolder(folder.id)}
                            >
                              <span className="truncate flex-1">{folder.name}</span>
                              {selectedPortfolioId === folder.id && (
                                <CheckCircle2 className="ml-2 h-4 w-4 text-primary" />
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="py-6 text-center text-sm text-muted-foreground">
                            {searchTerm ? "No portfolios found" : "No portfolios available"}
                          </div>
                        )}
                      </div>
                      {searchTerm && (
                        <div className="p-2 border-t text-xs text-muted-foreground bg-muted/30">
                          {filteredFolders.length} of {folders.length} portfolio(s) found
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
                <span>Portfolio selected - Advanced features are now available in the tabs below</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Folder Dialog */}
      {pendingFolderSelection && (
        <AddFolderDialog
          isOpen={showAddFolderDialog}
          onClose={handleDialogClose}
          folderId={pendingFolderSelection.id}
          folderName={pendingFolderSelection.name}
          onFolderAdded={handleFolderAdded}
        />
      )}
    </>
  );
}
