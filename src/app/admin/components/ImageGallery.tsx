"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Grid3X3, CheckSquare, XCircle, Download, X, Image, Maximize2, Square, Target, Users } from "lucide-react";
import AdminSearchBar from "./AdminSearchBar";

interface ImageGalleryProps {
  selectedPortfolioId: string;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredImages: { id: string; name: string; url: string }[];
  allImages: { id: string; name: string; url: string }[];
  displayImages: { id: string; name: string; url: string }[];
  selectedImages: Set<string>;
  setSelectedImages: (images: Set<string>) => void;
  downloadLoading: boolean;
  setEnlargedIndex: (index: number | null) => void;
  toggleSelectImage: (id: string) => void;
  handleDownloadSelected: () => void;
  hasMatchedImages?: boolean;
  setDisplayImages: (images: { id: string; name: string; url: string }[]) => void;
  isLoadingImages?: boolean;
  loadingProgress?: { loaded: number; total?: number };
  onFilteredResults: (filteredImages: any[]) => void;
}

export default function ImageGallery({
  selectedPortfolioId,
  searchTerm,
  setSearchTerm,
  filteredImages,
  allImages,
  displayImages,
  selectedImages,
  setSelectedImages,
  downloadLoading,
  setEnlargedIndex,
  toggleSelectImage,
  handleDownloadSelected,
  hasMatchedImages = false,
  setDisplayImages,
  isLoadingImages = false,
  loadingProgress = { loaded: 0 },
  onFilteredResults,
}: ImageGalleryProps) {
  if (!selectedPortfolioId) {
    return null;
  }

  // Filter all images based on search term
  const filteredAllImages = allImages.filter(image => 
    image.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter matched images based on search term
  const filteredMatchedImages = displayImages.filter(image => 
    image.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if we should show the dual gallery view (when matches exist or when no matches found after face matching)
  const shouldShowDualView = hasMatchedImages && (displayImages.length !== allImages.length || displayImages.length === 0);

  // Render image grid component
  const renderImageGrid = (images: { id: string; name: string; url: string }[], startIndex: number = 0) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {images.map((image, index) => (
        <div
          key={image.id}
          className="relative group aspect-square cursor-pointer rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all"
          onClick={() => setEnlargedIndex(startIndex + index)}
        >
          <img
            src={`https://drive.google.com/thumbnail?id=${image.id}&sz=w300`}
            alt={image.name}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
          
          {/* Selection checkbox */}
          <div 
            className="absolute top-2 left-2 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={selectedImages.has(image.id)}
              onChange={(e) => {
                e.stopPropagation();
                toggleSelectImage(image.id);
              }}
              className="w-4 h-4 rounded border-2 border-white/70 bg-white/10 backdrop-blur checked:bg-primary checked:border-primary cursor-pointer"
            />
          </div>

          {/* Preview indicator */}
          <div className="absolute bottom-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-6 h-6 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
              <Maximize2 className="w-3 h-3 text-white" />
            </div>
          </div>

          {/* Image name overlay - Always visible */}
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
            <p className="text-white text-xs font-medium truncate">
              {image.name}
            </p>
          </div>

          {/* Selected indicator */}
          {selectedImages.has(image.id) && (
            <div className="absolute inset-0 bg-primary/20 border-2 border-primary rounded-lg" />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Enhanced Search Bar */}
      <AdminSearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        images={displayImages.length > 0 ? displayImages : allImages}
        onFilteredResults={onFilteredResults}
      />

      {/* Show All Images Button - Only show when face matching has been performed */}
      {shouldShowDualView && (
        <Card className="border border-blue-500/30 bg-blue-50/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="font-medium">
                  {displayImages.length === 0 
                    ? "No face matches found" 
                    : `Showing ${displayImages.length} matched image${displayImages.length !== 1 ? 's' : ''}`
                  }
                </span>
                <span className="text-sm text-muted-foreground">
                  • {allImages.length} total in portfolio
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDisplayImages(allImages);
                  // Clear any existing selections to avoid confusion
                  setSelectedImages(new Set());
                }}
                className="text-xs"
              >
                <Grid3X3 className="w-3 h-3 mr-1" />
                Show All Images
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conditional rendering based on whether we have matched images */}
      {shouldShowDualView ? (
        /* Dual Gallery View - Matched Results + All Images */
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Matched Images Section */}
          <Card className="border border-green-500/30 bg-green-50/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-green-600 dark:text-green-400 font-medium">Face Match Results</span>
                    <span className="text-sm text-muted-foreground">({filteredMatchedImages.length})</span>
                  </div>
                </div>
                {/* Mobile-friendly button layout */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Only select matched images, preserve existing selections from other sections
                      const currentSelected = new Set(selectedImages);
                      filteredMatchedImages.forEach(img => currentSelected.add(img.id));
                      setSelectedImages(currentSelected);
                    }}
                    className="text-xs w-full sm:w-auto"
                  >
                    <CheckSquare className="w-3 h-3 mr-1" />
                    Select All Matched
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Only clear matched images, preserve portfolio selections
                      const currentSelected = new Set(selectedImages);
                      filteredMatchedImages.forEach(img => currentSelected.delete(img.id));
                      setSelectedImages(currentSelected);
                    }}
                    className="text-xs text-red-600 border-red-200 hover:bg-red-50 w-full sm:w-auto"
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    Clear Matched
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredMatchedImages.length > 0 ? (
                renderImageGrid(filteredMatchedImages, 0)
              ) : (
                <div className="py-8 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-muted/50 flex items-center justify-center">
                    <Image className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {searchTerm ? `No matched images found for "${searchTerm}"` : "No face matches found"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* All Images Section */}
          <Card className="border border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span>Complete Portfolio</span>
                    <span className="text-sm text-muted-foreground">({filteredAllImages.length})</span>
                  </div>
                </div>
                {/* Mobile-friendly button layout */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Only select portfolio images, preserve existing selections from matched section
                      const currentSelected = new Set(selectedImages);
                      filteredAllImages.forEach(img => currentSelected.add(img.id));
                      setSelectedImages(currentSelected);
                    }}
                    className="text-xs w-full sm:w-auto"
                  >
                    <CheckSquare className="w-3 h-3 mr-1" />
                    Select All Portfolio
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Only clear portfolio images, preserve matched selections
                      const currentSelected = new Set(selectedImages);
                      filteredAllImages.forEach(img => currentSelected.delete(img.id));
                      setSelectedImages(currentSelected);
                    }}
                    className="text-xs text-red-600 border-red-200 hover:bg-red-50 w-full sm:w-auto"
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    Clear Portfolio
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredAllImages.length > 0 ? (
                renderImageGrid(filteredAllImages, filteredMatchedImages.length)
              ) : (
                <div className="py-8 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-muted/50 flex items-center justify-center">
                    <Image className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {searchTerm ? `No images found for "${searchTerm}"` : "No images in portfolio"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Single Gallery View - All Images */
        <Card className="border border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Grid3X3 className="h-5 w-5 text-primary" />
                Gallery ({filteredImages.length} images)
              </div>
              <div className="flex items-center gap-3">
                {/* Select All / Clear All buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedImages(new Set(filteredImages.map(img => img.id)))}
                    className="text-xs"
                  >
                    <CheckSquare className="w-3 h-3 mr-1" />
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedImages(new Set())}
                    className="text-xs text-red-400"
                  >
                    <XCircle className="w-3 h-3 mr-1 text-red-400" />
                    Clear All
                  </Button>
                </div>
                {selectedImages.size > 0 && (
                  <>
                    <div className="h-4 w-px bg-border"></div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">
                        {selectedImages.size} selected
                      </span>
                      <Button
                        onClick={handleDownloadSelected}
                        disabled={downloadLoading}
                        size="sm"
                      >
                        {downloadLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin mr-2" />
                            Preparing...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Download Selected
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Loading state for images */}
            {isLoadingImages ? (
              <div className="py-16 text-center">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-lg font-medium">Loading images...</span>
                </div>
                {loadingProgress.total && loadingProgress.total > 0 && (
                  <div className="w-64 mx-auto">
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                      <span>Progress</span>
                      <span>{loadingProgress.loaded}/{loadingProgress.total}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${loadingProgress.total ? (loadingProgress.loaded / loadingProgress.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : filteredImages.length > 0 ? (
              renderImageGrid(filteredImages, 0)
            ) : (
              <div className="py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                  <Image className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No images found</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {searchTerm 
                    ? `No images match "${searchTerm}". Try adjusting your search.`
                    : "This portfolio is empty"
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Global Download Section - Only show when images are selected */}
      {selectedImages.size > 0 && shouldShowDualView && (
        <Card className="border border-primary/30 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="font-medium">
                  {selectedImages.size} image{selectedImages.size !== 1 ? 's' : ''} selected
                </span>
                <span className="text-sm text-muted-foreground">
                  (from both matched and all images)
                </span>
              </div>
              <Button
                onClick={handleDownloadSelected}
                disabled={downloadLoading}
                size="sm"
              >
                {downloadLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin mr-2" />
                    Preparing Download...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download All Selected
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
