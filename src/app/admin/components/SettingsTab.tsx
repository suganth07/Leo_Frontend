"use client";

import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { QRCodeCanvas } from "qrcode.react";
import { Settings, QrCode, Shield, Download, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import AdminControls from "@/app/admin/components/ChangeAdminPassword"

interface SettingsTabProps {
  selectedPortfolioId: string;
  showQR: boolean;
  setShowQR: (show: boolean) => void;
  showPasswordInput: boolean;
  setShowPasswordInput: (show: boolean) => void;
  folderPassword: string;
  setFolderPassword: (password: string) => void;
  isPasswordVisible: boolean;
  setIsPasswordVisible: (visible: boolean) => void;
  bypassUrl: string;
  handleSetFolderPassword: () => void;
}

export default function SettingsTab({
  selectedPortfolioId,
  showQR,
  setShowQR,
  showPasswordInput,
  setShowPasswordInput,
  folderPassword,
  setFolderPassword,
  isPasswordVisible,
  setIsPasswordVisible,
  bypassUrl,
  handleSetFolderPassword,
}: SettingsTabProps) {
  const qrRef = useRef<HTMLCanvasElement>(null);

  const handleDownloadQR = () => {
    const canvas = qrRef.current;
    if (canvas) {
      const url = canvas.toDataURL("image/jpeg");
      const a = document.createElement("a");
      a.href = url;
      a.download = "qr-code.jpg";
      a.click();
    }
  };
if(!selectedPortfolioId) {
  return(
    
      <AdminControls/>
  )}
if(selectedPortfolioId){

  return (
    <div className="space-y-6">
      {/* QR Code Generation & Portfolio Security - Single Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* QR Code Generation */}
        <Card className="border border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              QR Code Generation
            </CardTitle>
            <CardDescription>
              Generate QR codes for easy client access
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showQR ? (
              <Button
                onClick={() => setShowQR(true)}
                className="w-full h-12"
                variant="outline"
              >
                <QrCode className="w-4 h-4 mr-2" />
                Generate QR Code
              </Button>
            ) : (
              <div className="space-y-4">
                {/* QR Code with smooth appearance */}
                <div className="bg-gradient-to-br from-background to-muted/30 p-6 rounded-lg border border-border/50 text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
                  <div className="relative bg-white p-3 rounded-lg shadow-sm inline-block">
                    <QRCodeCanvas 
                      value={bypassUrl} 
                      size={140}
                      className="mx-auto"
                      ref={qrRef}
                      level="M"
                      includeMargin={true}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">Scan to access portfolio</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={handleDownloadQR}
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(bypassUrl);
                      toast.success("Link copied!");
                    }}
                    size="sm"
                  >
                    Copy Link
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setShowQR(false)}
                  className="w-full text-xs"
                  size="sm"
                >
                  Hide QR Code
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Portfolio Security */}
        <Card className="border border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Portfolio Security
            </CardTitle>
            <CardDescription>
              Set password protection for portfolio access
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showPasswordInput ? (
              <Button
                onClick={() => setShowPasswordInput(true)}
                className="w-full h-12"
                variant="outline"
              >
                <Shield className="w-4 h-4 mr-2" />
                Set Portfolio Password
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="portfolio-password">Portfolio Password</Label>
                  <div className="relative">
                    <Input
                      id="portfolio-password"
                      type={isPasswordVisible ? "text" : "password"}
                      placeholder="Enter secure password..."
                      value={folderPassword}
                      onChange={(e) => setFolderPassword(e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full w-10"
                      onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                    >
                      {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleSetFolderPassword}
                    disabled={!folderPassword}
                    className="flex-1"
                    size="sm"
                  >
                    Set Password
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPasswordInput(false);
                      setFolderPassword("");
                    }}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
          <AdminControls/>
      </div>
    </div>
  );
}
}