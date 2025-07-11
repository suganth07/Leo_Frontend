"use client";

import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, FolderOpen, Lock, Upload, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatusIndicatorProps {
  selectedFolderId: string;
  isPasswordVerified: boolean;
  file: File | null;
  hasMatchedImages: boolean;
}

const StatusIndicator = ({
  selectedFolderId,
  isPasswordVerified,
  file,
  hasMatchedImages
}: StatusIndicatorProps) => {
  const steps = [
    {
      id: 'portfolio',
      label: 'Portfolio',
      completed: !!selectedFolderId,
      icon: FolderOpen,
    },
    {
      id: 'password',
      label: 'Password',
      completed: isPasswordVerified,
      icon: Lock,
      disabled: !selectedFolderId,
    },
    {
      id: 'upload',
      label: 'Photo',
      completed: !!file,
      icon: Upload,
      disabled: !selectedFolderId || !isPasswordVerified,
    },
    {
      id: 'search',
      label: 'Search',
      completed: hasMatchedImages,
      icon: Search,
      disabled: !selectedFolderId || !isPasswordVerified || !file,
    },
  ];

  return (
    <Card className="border border-border/60">
      <CardContent className="p-4">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Getting Started</h3>
          <div className="space-y-1">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = !step.disabled && !step.completed;
              const isPending = step.disabled;
              
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-2 p-1.5 rounded-md transition-colors ${
                    step.completed 
                      ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300' 
                      : isActive
                      ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                      : isPending
                      ? 'bg-muted/50 text-muted-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                    step.completed 
                      ? 'bg-green-100 dark:bg-green-900/50' 
                      : isActive
                      ? 'bg-blue-100 dark:bg-blue-900/50'
                      : 'bg-muted'
                  }`}>
                    {step.completed ? (
                      <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                    ) : isActive ? (
                      <AlertCircle className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Icon className="w-3 h-3" />
                    )}
                  </div>
                  <span className="text-xs font-medium">
                    {step.label}
                  </span>
                  {step.completed && (
                    <span className="text-xs text-green-600 dark:text-green-400 ml-auto">
                      ✓
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatusIndicator;
