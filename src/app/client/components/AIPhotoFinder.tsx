"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, Upload, X, Search, CheckCircle, XCircle, Loader2, AlertCircle 
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageUtils } from "@/lib/image-utils";
import { toast } from "react-hot-toast";

interface AIPhotoFinderProps {
  loading: boolean;
  matchLoading: boolean;
  progress: number;
  file: File | null;
  selectedFolderId: string;
  isPasswordVerified: boolean;
  onFileChange: (file: File | null) => void;
  onMatch: () => Promise<void>;
  onSelectAll: () => void;
  onClearAll: () => void;
}

const AIPhotoFinder = ({
  loading,
  matchLoading,
  progress,
  file,
  selectedFolderId,
  isPasswordVerified,
  onFileChange,
  onMatch,
  onSelectAll,
  onClearAll
}: AIPhotoFinderProps) => {
  const [processedFile, setProcessedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<{
    dimensions?: { width: number; height: number };
    originalSize: number;
    processedSize?: number;
  } | null>(null);
  const [processingImage, setProcessingImage] = useState(false);

  // Handle file selection with client-side validation and optimization
  const handleFileSelection = useCallback(async (selectedFile: File | null) => {
    if (!selectedFile) {
      onFileChange(null);
      setProcessedFile(null);
      setImageInfo(null);
      if (imagePreview) {
        ImageUtils.revokeImagePreview(imagePreview);
        setImagePreview(null);
      }
      return;
    }

    setProcessingImage(true);

    try {
      // Client-side validation
      const validation = ImageUtils.validateImage(selectedFile);
      if (!validation.isValid) {
        toast.error(validation.error || 'Invalid file');
        setProcessingImage(false);
        return;
      }

      // Get image dimensions
      const dimensions = await ImageUtils.getImageDimensions(selectedFile);
      
      // Create optimized version for faster processing
      const optimizedFile = await ImageUtils.resizeImage(selectedFile, {
        maxWidth: 640,
        maxHeight: 640,
        quality: 0.85
      });

      // Create preview
      const preview = ImageUtils.createImagePreview(optimizedFile);

      // Update state
      setProcessedFile(optimizedFile);
      setImagePreview(preview);
      setImageInfo({
        dimensions,
        originalSize: selectedFile.size,
        processedSize: optimizedFile.size
      });

      // Pass optimized file to parent
      onFileChange(optimizedFile);

      // Show optimization info if significant reduction
      const reductionPercent = ((selectedFile.size - optimizedFile.size) / selectedFile.size) * 100;
      if (reductionPercent > 20) {
        toast.success(`Image optimized! Size reduced by ${Math.round(reductionPercent)}%`);
      }

    } catch (error) {
      console.error('Image processing error:', error);
      toast.error('Failed to process image. Please try another file.');
    } finally {
      setProcessingImage(false);
    }
  }, [onFileChange, imagePreview]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (imagePreview) {
        ImageUtils.revokeImagePreview(imagePreview);
      }
    };
  }, [imagePreview]);

  // Enhanced file info display
  const renderFileInfo = () => {
    if (!processedFile || !imageInfo) return null;

    const formatSize = (bytes: number) => {
      const kb = bytes / 1024;
      const mb = kb / 1024;
      return mb > 1 ? `${mb.toFixed(1)}MB` : `${Math.round(kb)}KB`;
    };

    return (
      <div className="text-xs text-muted-foreground space-y-1">
        <div>Dimensions: {imageInfo.dimensions?.width} × {imageInfo.dimensions?.height}</div>
        <div>Size: {formatSize(imageInfo.originalSize)} 
          {imageInfo.processedSize && imageInfo.processedSize !== imageInfo.originalSize && 
            ` → ${formatSize(imageInfo.processedSize)}`}
        </div>
        <div className="text-green-600">✓ Optimized for AI processing</div>
      </div>
    );
  };
  return (
    <>
      {/* AI Photo Matching */}
      <Card className="border border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Photo Finder
          </CardTitle>
          <CardDescription>Upload your photo to find all similar images using AI</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Upload Preview */}
          {processedFile && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 border rounded-lg bg-muted/20 space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={imagePreview || ''}
                    className="w-16 h-16 object-cover rounded-md border"
                    alt="Upload preview"
                  />
                  {processingImage && (
                    <div className="absolute inset-0 bg-black/50 rounded-md flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{processedFile.name}</p>
                  {renderFileInfo()}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                  onClick={() => handleFileSelection(null)}
                  disabled={processingImage}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Upload Button */}
            <div className="relative">
              <label className="block w-full cursor-pointer group">
                <div className={`p-4 rounded-lg border border-dashed hover:border-primary flex flex-col items-center justify-center gap-2 transition-colors min-h-[90px] ${
                  processingImage ? 'opacity-50 cursor-not-allowed' : ''
                }`}>
                  {processingImage ? (
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  ) : (
                    <Upload className="w-5 h-5 group-hover:text-primary transition-colors" />
                  )}
                  <div className="text-xs font-medium text-center">
                    {processingImage ? 'Processing...' : 'Upload Photo'}
                  </div>
                  {!processedFile && (
                    <div className="text-xs text-muted-foreground text-center">
                      JPEG, PNG, WebP (max 10MB)
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={(e) => handleFileSelection(e.target.files?.[0] || null)}
                  className="hidden"
                  disabled={processingImage}
                />
              </label>
              
              {processedFile && !processingImage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full overflow-hidden border-2 border-primary shadow-lg bg-white"
                >
                  <img 
                    src={imagePreview || ''} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              )}
            </div>

            {/* AI Search Button */}
            <Button
              variant="outline"
              className="h-[90px] flex flex-col items-center justify-center gap-1.5 hover:border-primary/50 transition-colors disabled:opacity-50"
              onClick={onMatch}
              disabled={matchLoading || !processedFile || processingImage || !selectedFolderId || !isPasswordVerified}
            >
              {matchLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              <div className="text-xs font-medium text-center">
                {matchLoading ? "Searching..." : "Find Photos"}
              </div>
              {!processedFile ? (
                <div className="text-xs text-muted-foreground text-center">
                  Upload photo first
                </div>
              ) : !selectedFolderId ? (
                <div className="text-xs text-muted-foreground text-center">
                  Select portfolio first
                </div>
              ) : !isPasswordVerified ? (
                <div className="text-xs text-muted-foreground text-center">
                  Verify password first
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  Upload first
                </div>
              )}
            </Button>

            {/* Select All Button */}
            <Button
              variant="outline"
              className="h-[90px] flex flex-col items-center justify-center gap-1.5 hover:border-primary/50 transition-colors"
              onClick={onSelectAll}
            >
              <CheckCircle className="w-5 h-5" />
              <div className="text-xs font-medium text-center">Select All</div>
            </Button>

            {/* Clear Button */}
            <Button
              variant="outline"
              className="h-[90px] flex flex-col items-center justify-center gap-1.5 hover:border-destructive/50 transition-colors"
              onClick={onClearAll}
            >
              <XCircle className="w-5 h-5 hover:text-destructive" />
              <div className="text-xs font-medium text-center">Clear All</div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Progress Bar */}
      {loading && progress > 0 && (
        <Card className="border border-border/60">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing images...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default AIPhotoFinder;
