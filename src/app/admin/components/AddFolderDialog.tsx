"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FolderOpen, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AddFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  folderId: string;
  folderName: string;
  onFolderAdded: () => void;
}

export default function AddFolderDialog({
  isOpen,
  onClose,
  folderId,
  folderName,
  onFolderAdded
}: AddFolderDialogProps) {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast.error("Please enter a password for this folder");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/admin/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folder_id: folderId,
          folder_name: folderName,
          password: password.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add folder');
      }

      toast.success("Folder added successfully to the database");
      setPassword("");
      onFolderAdded();
      onClose();
    } catch (error) {
      console.error('Error adding folder:', error);
      toast.error(error instanceof Error ? error.message : "Failed to add folder");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setPassword("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            Add New Portfolio
          </DialogTitle>
          <DialogDescription>
            This portfolio is not in the database. Please provide a password to add it.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Folder Information */}
          <Card className="bg-muted/30">
            <CardContent className="pt-4 space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Folder Name</Label>
                <p className="font-medium text-sm break-all">{folderName}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Folder ID</Label>
                <p className="font-mono text-xs text-muted-foreground break-all">{folderId}</p>
              </div>
            </CardContent>
          </Card>

          {/* Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Portfolio Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password for this portfolio"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                This password will be required to access this portfolio in the future.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !password.trim()}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Portfolio"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
