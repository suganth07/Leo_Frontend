"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SelectedImageDisplayProps {
  file: File | null;
  onClearFile: () => void;
}

const SelectedImageDisplay = ({
  file,
  onClearFile
}: SelectedImageDisplayProps) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Generate preview URL when file changes
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImagePreview(null);
    }
  }, [file]);

  if (!file) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="lg:col-span-3"
    >
      <Card className="border border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              Selected Image
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFile}
              className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Image Preview */}
          <div className="aspect-square bg-muted rounded-lg overflow-hidden border">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Selected for matching"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          
          {/* File Info */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground truncate">
              {file.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024 / 1024).toFixed(1)} MB
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SelectedImageDisplay;
