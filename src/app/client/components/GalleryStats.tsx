"use client";

import { ImageIcon, TrendingUp, Target, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DataProcessor, type ImageData } from "@/lib/data-processor";

interface GalleryStatsProps {
  totalImages: number;
  filteredImages: number;
  selectedCount: number;
  images?: ImageData[];
  showAdvancedStats?: boolean;
}

const GalleryStats = ({ 
  totalImages, 
  filteredImages, 
  selectedCount, 
  images = [],
  showAdvancedStats = false 
}: GalleryStatsProps) => {
  // Calculate advanced statistics on frontend
  const stats = images.length > 0 ? DataProcessor.calculateImageStats(images) : null;
  const confidenceGroups = images.length > 0 ? DataProcessor.groupImagesByConfidence(images) : null;

  const formatConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600";
    if (confidence >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card className="border border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ImageIcon className="h-5 w-5 text-primary" />
          Gallery Statistics
        </CardTitle>
        <CardDescription>
          {showAdvancedStats ? "Detailed collection analytics" : "Current collection overview"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Photos:</span>
            <span className="font-semibold">{totalImages.toLocaleString()}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Showing:</span>
            <span className="font-semibold">{filteredImages.toLocaleString()}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Selected:</span>
            <span className="font-semibold text-primary">{selectedCount.toLocaleString()}</span>
          </div>

          {filteredImages !== totalImages && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Filter Active:</span>
              <span className="text-blue-600 font-medium">
                {Math.round((filteredImages / totalImages) * 100)}% visible
              </span>
            </div>
          )}
        </div>

        {/* Advanced Stats for Face Matching Results */}
        {showAdvancedStats && stats && confidenceGroups && (
          <>
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Match Quality</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Average Confidence:</span>
                  <span className={`font-semibold ${formatConfidenceColor(stats.averageConfidence)}`}>
                    {stats.averageConfidence}%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center p-2 bg-green-50 dark:bg-green-950/20 rounded">
                    <div className="font-medium text-green-700 dark:text-green-400">
                      {confidenceGroups.high.length}
                    </div>
                    <div className="text-green-600 dark:text-green-500">High (80%+)</div>
                  </div>
                  
                  <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded">
                    <div className="font-medium text-yellow-700 dark:text-yellow-400">
                      {confidenceGroups.medium.length}
                    </div>
                    <div className="text-yellow-600 dark:text-yellow-500">Med (60-79%)</div>
                  </div>
                  
                  <div className="text-center p-2 bg-red-50 dark:bg-red-950/20 rounded">
                    <div className="font-medium text-red-700 dark:text-red-400">
                      {confidenceGroups.low.length}
                    </div>
                    <div className="text-red-600 dark:text-red-500">Low (&lt;60%)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Indicator */}
            <div className="border-t pt-3">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Search Performance</span>
              </div>
              
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Processing:</span>
                  <span className="text-green-600">✓ Client-optimized</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Load Time:</span>
                  <span className="text-blue-600">Ultra-fast</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Selection Progress */}
        {selectedCount > 0 && (
          <div className="border-t pt-3">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Selection Progress:</span>
              <span className="font-medium">
                {Math.round((selectedCount / filteredImages) * 100)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(selectedCount / filteredImages) * 100}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GalleryStats;
