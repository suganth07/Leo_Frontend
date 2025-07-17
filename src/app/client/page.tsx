"use client";

import { useState, useEffect } from "react";
import {supabase} from "@/lib/supabase";
import axios from "axios";
import { motion } from "framer-motion";
import { Toaster } from "sonner";
import { toast } from "sonner";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import Navbar from "@/components/ui/navbar";
import PageLoadingScreen from "@/components/ui/PageLoadingScreen";

// Components
import ClientHeader from "./components/ClientHeader";
import PortfolioSelection from "./components/PortfolioSelection";
import PasswordVerification from "./components/PasswordVerification";
import GalleryStats from "./components/GalleryStats";
import AIPhotoFinder from "./components/AIPhotoFinder";
import SearchBar from "./components/SearchBar";
import SelectionSummary from "./components/SelectionSummary";
import ImageGallery from "./components/ImageGallery";
import LightboxModal from "./components/LightboxModal";
import Footer from "./components/Footer";
import StatusIndicator from "./components/StatusIndicator";
import SelectedImageDisplay from "./components/SelectedImageDisplay";

// Google Drive integration
import { useDriveData } from "@/lib/hooks/useDriveData";

// Optimized utilities
import { OptimizedApiClient, type MatchStreamData } from "@/lib/optimized-api";
import { DataProcessor } from "@/lib/data-processor";
import { ImageUtils } from "@/lib/image-utils";
import { ENV_DEBUG } from "@/lib/env-debug";

const PHOTOS_FOLDER_ID = process.env.NEXT_PUBLIC_PHOTOS_FOLDER_ID;


export default function ClientPage() {
  // Get BASE_URL with fallback for development
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000';
  
  console.log("Client Page - BASE_URL:", BASE_URL);
  
  // Initialize API client with proper BASE_URL inside component
  const apiClient = OptimizedApiClient.getInstance(BASE_URL);

  // Google Drive integration with direct API access
  const {
    folders,
    images: allImages,
    isLoadingFolders,
    isLoadingImages,
    error: driveError,
    fetchImages: fetchImagesFromDrive,
    clearImages,
    progress: driveProgress
  } = useDriveData({ 
    photosRootFolderId: PHOTOS_FOLDER_ID,
    enableAutoFetch: true // Auto-fetch folders on load for client
  });

  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [displayImages, setDisplayImages] = useState<{ id: string; name: string; url: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [enlargedIndex, setEnlargedIndex] = useState<number | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [folderPassword, setFolderPassword] = useState("");
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [isFolderChanging, setIsFolderChanging] = useState(false);
  const [hasPerformedFaceMatching, setHasPerformedFaceMatching] = useState(false);
  
  // Enhanced filtering and sorting state
  const [currentFilteredImages, setCurrentFilteredImages] = useState<{ id: string; name: string; url: string; confidence?: number }[]>([]);

  // Initialize page loading based on Drive data loading
  useEffect(() => {
    if (!isLoadingFolders && folders.length > 0) {
      setTimeout(() => {
        setPageLoading(false);
        setInitialLoadComplete(true);
        // toast.success("✨ Connected directly to Google Drive!");
      }, 800);
    } else if (!isLoadingFolders && folders.length === 0 && PHOTOS_FOLDER_ID) {
      // No folders found
      setTimeout(() => {
        setPageLoading(false);
        setInitialLoadComplete(true);
        // toast.warning("No folders found in Google Drive");
      }, 800);
    }
  }, [isLoadingFolders, folders, PHOTOS_FOLDER_ID]);

  // Remove the backend fallback completely
  // const fetchFoldersViaBackend = async () => {
  //   // This function has been removed to use only direct Google Drive API
  // };

  // Update display images when allImages changes
  useEffect(() => {
    setDisplayImages(allImages);
    setCurrentFilteredImages(allImages);
    // Always stop folder changing when we get a response (even if empty)
    if (selectedFolderId && isFolderChanging && !isLoadingImages) {
      setIsFolderChanging(false);
      if (allImages.length == 0){
        
        // Don't show error toast for empty folders, let the gallery show "no images" message
        console.log("Folder is empty or no images found");
      }
    }
  }, [allImages, selectedFolderId, isFolderChanging, isLoadingImages]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const folderId = params.get("folderId");
    const bypass = params.get("bypass");

    if (folderId) {
      setSelectedFolderId(folderId);
      if (bypass === "1") {
        setIsPasswordVerified(true);
        loadImagesFromDrive(folderId);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedFolderId && isPasswordVerified) {
      setIsFolderChanging(true);
      clearImages(); // Clear previous images immediately  
      setDisplayImages([]); // Clear display images
      setSelectedImages(new Set()); // Clear selections
      setHasPerformedFaceMatching(false); // Reset face matching state when folder changes
      
      // Add brief delay for better UX feedback
      setTimeout(() => {
        loadImagesFromDrive(selectedFolderId);
      }, 300);
    } else if (selectedFolderId && !isPasswordVerified) {
      setIsFolderChanging(false);
    }
  }, [selectedFolderId, isPasswordVerified]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (enlargedIndex !== null) {
        if (e.key === "ArrowRight") setEnlargedIndex((prev) => (prev !== null ? (prev + 1) % filteredImages.length : null));
        if (e.key === "ArrowLeft") setEnlargedIndex((prev) => (prev !== null ? (prev - 1 + filteredImages.length) % filteredImages.length : null));
        if (e.key === "Escape") setEnlargedIndex(null);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enlargedIndex, displayImages.length]);

  // Custom setDisplayImages function that handles face matching state
  const handleSetDisplayImages = (images: { id: string; name: string; url: string }[]) => {
    setDisplayImages(images);
    setCurrentFilteredImages(images);
    // If setting to all images, reset face matching state to exit dual view
    if (images.length === allImages.length) {
      setHasPerformedFaceMatching(false);
    }
  };

  const filteredImages = currentFilteredImages.filter(image => 
    image.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle filtered results from SearchBar
  const handleFilteredResults = (filtered: any[]) => {
    setCurrentFilteredImages(filtered);
  };

  // Handle Google Drive errors
  useEffect(() => {
    if (driveError) {
      console.error('Google Drive API Error:', driveError);
      toast.error("Failed to connect to Google Drive");
      setIsFolderChanging(false); // Stop folder changing state on error
    }
  }, [driveError]);

  // Load images using direct Google Drive API
  const loadImagesFromDrive = async (folderId: string) => {
    try {
      console.log(`🚀 Loading images directly from Google Drive for folder: ${folderId}`);
      
      // Show loading feedback
      // toast.info("Loading photos from collection...", { duration: 2000 });
      
      // Use batch fetching for large datasets with progress indication
      await fetchImagesFromDrive(folderId, true);
      
      console.log(`Successfully initiated image loading from direct API`);
    } catch (error) {
      console.error('Error loading images from Drive:', error);
      toast.error("Failed to load images from Google Drive");
      setIsFolderChanging(false); // Stop loading state on error
    }
  };

  // Remove the backend fallback completely
  // const fetchImagesViaBackend = async (folderId: string) => {
  //   // This function has been removed to use only direct Google Drive API
  // };

  // Optimized face matching using frontend utilities
  async function handleMatch() {
    console.log("handleMatch called with:", { 
      fileExists: !!file, 
      fileName: file?.name, 
      selectedFolderId, 
      isPasswordVerified 
    });

    if (!file) {
      toast.error("Please upload an image first!");
      return;
    }

    if (!selectedFolderId) {
      toast.error("Please select a portfolio first!");
      return;
    }

    if (!isPasswordVerified) {
      toast.error("Please verify the folder password first!");
      return;
    }

    // Validate BASE_URL before making request
    if (!BASE_URL) {
      toast.error("Backend URL not configured. Please check your environment variables.");
      return;
    }

    try {
      setLoading(true);
      setProgress(0);
      setMatchLoading(true);

      console.log("Starting face match with BASE_URL:", BASE_URL);
      console.log("Selected folder ID:", selectedFolderId);
      console.log("File:", file.name);

      // Enhanced progress callback with better feedback
      const onProgress = (data: MatchStreamData) => {
        if (data.progress !== undefined) {
          setProgress(data.progress);
        }
        
        // Show progress updates to user
        if (data.progress && data.progress % 20 === 0) {
          toast.loading(`Searching... ${data.progress}% complete`, {
            id: 'search-progress',
            duration: 1000
          });
        }
      };

      // Use optimized API client with client-side preprocessing
      const result = await apiClient.matchFaces(file, selectedFolderId, onProgress);

      if (!result.success) {
        console.error("Match faces failed:", result.error);
        
        // Provide more specific error messages
        if (result.error?.includes('404') || result.error?.includes('Not Found')) {
          toast.error("Face recognition service not available. Please contact support.");
        } else if (result.error?.includes('encoding')) {
          toast.error("Please create face encodings first in the admin panel.");
        } else {
          toast.error(result.error || "Face matching failed");
        }
        return;
      }

      if (result.data && result.data.images) {
        // Process results on frontend for better performance
        const processedImages = DataProcessor.sortImages(result.data.images, {
          field: 'confidence',
          direction: 'desc'
        });

        setDisplayImages(processedImages);
        setHasPerformedFaceMatching(true);

        // Calculate and show detailed stats
        const stats = DataProcessor.calculateImageStats(processedImages);
        toast.success(
          `🎯 Found ${stats.total} matching photos! (${stats.highConfidenceCount} high confidence matches)`,
          { duration: 4000 }
        );

        // Clear progress toast
        toast.dismiss('search-progress');
      } else {
        toast.info("No matching faces found in this collection.");
      }

    } catch (error) {
      console.error("Error matching faces:", error);
      
      // Better error handling for different error types
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('<!DOCTYPE') || errorMessage.includes('HTML')) {
        toast.error("Service temporarily unavailable. Please try again later.");
      } else if (errorMessage.includes('fetch')) {
        toast.error("Network error. Please check your connection.");
      } else {
        toast.error("Failed to match faces. Please try again.");
      }
      
      toast.dismiss('search-progress');
    } finally {
      setLoading(false);
      setProgress(0);
      setMatchLoading(false);
    }
  }

  async function verifyFolderPassword(password: string) {
    if (!selectedFolderId || !password) {
      toast.error("Please enter a password.");
      return;
    }

    try {
      setPasswordLoading(true);
      
      if (!supabase) {
        toast.error("Database connection not available.");
        return;
      }

      const { data, error } = await supabase
        .from("folders")
        .select("password")
        .eq("folder_id", selectedFolderId)
        .single();

      if (error || !data) {
        toast.error("Folder not found.");
        return;
      }

      console.log("Password verification for folder:", selectedFolderId);

      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 600));

      if (data.password === password) {
        toast.success("Access granted!");
        setIsPasswordVerified(true);
        setFolderPassword(password);
        loadImagesFromDrive(selectedFolderId);
      } else {
        toast.error("Incorrect password. Try again.");
      }
    } catch (err) {
      console.error("Error verifying password:", err);
      toast.error("Something went wrong.");
    } finally {
      setPasswordLoading(false);
    }
  }

  const toggleSelectImage = (id: string) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedImages(newSelected);
  };

  const handleDownloadSelected = async (imagesToDownload: Set<string> | null = null) => {
    const imagesToProcess = imagesToDownload || selectedImages;
    
    if (imagesToProcess.size === 0) return;
    
    try {
      setDownloadLoading(true);
      let successCount = 0;
      const totalCount = imagesToProcess.size;
      
      // Show progress for multiple downloads
      if (totalCount > 1) {
        toast.loading(`Preparing ${totalCount} downloads...`, { id: 'download-progress' });
      }
      
      for (const fileId of imagesToProcess) {
        try {
          // Get metadata and file data from backend
          const [metadataRes, fileRes] = await Promise.all([
            fetch(`${BASE_URL}/api/file-metadata?file_id=${fileId}`),
            fetch(`${BASE_URL}/api/file-download?file_id=${fileId}`)
          ]);
          
          if (!metadataRes.ok || !fileRes.ok) {
            throw new Error(`Failed to fetch data for image`);
          }
          
          const { name } = await metadataRes.json();
          const blob = await fileRes.blob();
          
          // Create download without opening any external pages
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = name || `image_${fileId}.jpg`;
          link.style.display = "none";
          
          // Trigger download silently
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up blob URL to free memory
          window.URL.revokeObjectURL(url);
          successCount++;
          
          // Update progress for multiple downloads
          if (totalCount > 1) {
            toast.loading(`Downloaded ${successCount} of ${totalCount} images...`, { 
              id: 'download-progress' 
            });
          }
          
          // Small delay between downloads to prevent browser blocking
          if (successCount < totalCount) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          
        } catch (error) {
          console.error(`Error downloading file ${fileId}:`, error);
          const imageName = allImages.find(img => img.id === fileId)?.name || 'Unknown image';
          toast.error(`Failed to download: ${imageName.slice(0, 30)}...`);
        }
      }
      
      // Dismiss progress toast
      toast.dismiss('download-progress');
      
      // Show final result
      if (successCount === totalCount) {
        toast.success(`✅ Successfully downloaded ${successCount} image${totalCount > 1 ? 's' : ''}!`);
      } else if (successCount > 0) {
        toast.warning(`⚠️ Downloaded ${successCount} of ${totalCount} images. Some failed.`);
      } else {
        toast.error("❌ All downloads failed. Please try again.");
      }
      
    } catch (error) {
      console.error("Error in download process:", error);
      toast.dismiss('download-progress');
      toast.error("Download process failed.");
    } finally {
      setDownloadLoading(false);
    }
  }; 

  const handleSelectAll = () => setSelectedImages(new Set(filteredImages.map(img => img.id)));
  const handleClearAll = () => { 
    setSelectedImages(new Set()); 
    setDisplayImages(allImages); 
    setFile(null); 
  };
  
  const handleFolderChange = (value: string) => {
    setSelectedFolderId(value);
    setIsPasswordVerified(false);
    setDisplayImages([]);
    setIsFolderChanging(false); // Reset folder changing state
    setSelectedImages(new Set()); // Clear selections
  };

  const handleAIMatch = async () => {
    setMatchLoading(true);
    await handleMatch();
    setMatchLoading(false);
    setFile(null);
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300 relative overflow-y-hidden">
      <AnimatedBackground />
      <Toaster position="top-center" />
      
      {/* Page Loading Screen */}
      {pageLoading && (
        <PageLoadingScreen 
          message="Loading client portal..." 
        />
      )}
      
      {/* Navbar */}
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 relative z-10 max-w-full overflow-x-hidden">
        <div className="max-w-7xl mx-auto space-y-6 overflow-x-hidden">
          {/* Client Header */}
          {initialLoadComplete && <ClientHeader />}

          {/* Portfolio Selection */}
           {initialLoadComplete && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid lg:grid-cols-1 gap-2"
            >
              {/* Portfolio Selection Card */}
              <PortfolioSelection 
                folders={folders}
                selectedFolderId={selectedFolderId}
                onFolderChange={handleFolderChange}
                isLoading={isLoadingFolders}
              />

              {/* Password Verification Card */}
              {selectedFolderId && !isPasswordVerified && (
                <PasswordVerification 
                  onVerifyPassword={verifyFolderPassword}
                  isLoading={passwordLoading}
                />
              )}
            </motion.div>
          )}

          {/* AI Photo Finder & Controls */}
          {initialLoadComplete && selectedFolderId && isPasswordVerified && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-4"
            >
              {/* Main Controls Row: Portfolio + Action Buttons */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                {/* Portfolio Selection - Reduced width */}
                {/* <div className="lg:col-span-4">
                  <PortfolioSelection 
                    folders={folders}
                    selectedFolderId={selectedFolderId}
                    onFolderChange={handleFolderChange}
                  />
                </div> */}
                
                {/* Action Buttons Row */}
                <div className="lg:col-span-8 space-y-3">
                  {/* First Row: Upload, Find Photos, Select All */}
                  <div className="grid grid-cols-3 gap-3">
                    {/* Upload Button */}
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setFile(e.target.files?.[0] || null)}
                          className="hidden"
                          id="file-upload"
                        />
                        <label
                          htmlFor="file-upload"
                          className="w-full h-12 px-3 border border-border rounded-md bg-card hover:bg-accent cursor-pointer flex items-center justify-center text-sm font-medium transition-colors"
                        >
                          {file ? file.name.slice(0, 8) + '...' : 'Choose Image'}
                        </label>
                      </div>
                    </div>

                    {/* Find Photos Button */}
                    <div className="space-y-2">
                      <button
                        onClick={handleAIMatch}
                        disabled={!file || loading || matchLoading}
                        className="w-full h-12 px-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm font-medium transition-colors"
                      >
                        {matchLoading ? 'Searching...' : 'Find Similar'}
                      </button>
                    </div>

                    {/* Select All Button */}
                    <div className="space-y-2">
                      <button
                        onClick={handleSelectAll}
                        className="w-full h-12 px-3 border border-border rounded-md bg-card hover:bg-accent text-sm font-medium transition-colors"
                      >
                        Select All
                      </button>
                    </div>
                  </div>
                  
                  {/* Second Row: Clear All Button (Mobile Friendly) */}
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-2">
                      <button
                        onClick={handleClearAll}
                        className="w-full h-12 px-3 border border-destructive/20 rounded-md bg-destructive/5 hover:bg-destructive/10 text-sm font-medium transition-colors text-destructive"
                      >
                        Clear All Selections
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Second Row: Getting Started + Search Bar + Gallery Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* Getting Started Card */}
                <div className="lg:col-span-3">
                  <StatusIndicator 
                    selectedFolderId={selectedFolderId}
                    isPasswordVerified={isPasswordVerified}
                    file={file}
                    hasMatchedImages={hasPerformedFaceMatching}
                  />
                </div>

                {/* Selected Image Display */}
                <SelectedImageDisplay 
                  file={file}
                  onClearFile={() => setFile(null)}
                />

                {/* Search Bar - Centered */}
                <div className={`${file ? 'lg:col-span-3' : 'lg:col-span-6'}`}>
                  <SearchBar 
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    images={displayImages}
                    onFilteredResults={handleFilteredResults}
                    showConfidenceFilter={hasPerformedFaceMatching}
                  />
                </div>

                {/* Gallery Statistics Card */}
                <div className="lg:col-span-3">
                  <GalleryStats 
                    totalImages={allImages.length}
                    filteredImages={filteredImages.length}
                    selectedCount={selectedImages.size}
                    images={displayImages}
                    showAdvancedStats={hasPerformedFaceMatching}
                  />
                </div>
              </div>

              {/* Selection Summary */}
              <SelectionSummary 
                selectedCount={selectedImages.size}
                downloadLoading={downloadLoading}
                onDownloadSelected={() => handleDownloadSelected()}
              />
            </motion.div>
          )}

          {/* Image Gallery */}
          {selectedFolderId && isPasswordVerified && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-6"
            >
              <ImageGallery 
                images={allImages}
                filteredImages={filteredImages}
                allImages={allImages}
                displayImages={displayImages}
                allImagesCount={allImages.length}
                selectedImages={selectedImages}
                searchTerm={searchTerm}
                onImageSelect={toggleSelectImage}
                onSingleDownload={(id) => handleDownloadSelected(new Set([id]))}
                onClearSearch={() => setSearchTerm('')}
                onShowLightbox={(index) => setEnlargedIndex(index)}
                onSelectAll={setSelectedImages}
                hasMatchedImages={hasPerformedFaceMatching}
                isLoadingImages={isLoadingImages || isFolderChanging}
                progress={driveProgress}
                setDisplayImages={handleSetDisplayImages}
              />
            </motion.div>
          )}

          {/* Footer */}
          <Footer />
        </div>
      </div>

      {/* Enhanced Lightbox Modal */}
      <LightboxModal
        images={filteredImages}
        currentIndex={enlargedIndex}
        selectedImages={selectedImages}
        onClose={() => setEnlargedIndex(null)}
        onNavigate={(newIndex) => setEnlargedIndex(newIndex)}
        onToggleSelect={toggleSelectImage}
        onDownload={(id) => handleDownloadSelected(new Set([id]))}
      />
    </div>
  );
}
