"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, Download, Search, Upload, XCircle, CheckCircle, Eye, EyeOff, 
  ChevronLeft, Square, CheckSquare, X, Maximize2, QrCode, Trash2, Database, 
  ChevronRight, FolderSearch, XSquare, Link2, Camera, Settings, Shield, 
  Sparkles, ImageIcon, Grid3X3, Lock
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import LogoutButton from "./logout-button";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import ParticleBackground from "@/components/ui/ParticleBackground";
import ThemeToggle from "@/components/ui/ThemeToggle";

// Supabase configuration with fallbacks
const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fallback-key';
const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fallback.supabase.co';

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY);
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL; 

console.log("Admin Page - BASE_URL:", BASE_URL);

export default function AdminPage() {
  const [folders, setFolders] = useState<{ id: string; name: string }[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [allImages, setAllImages] = useState<{ id: string; name: string; url: string }[]>([]);
  const [displayImages, setDisplayImages] = useState<{ id: string; name: string; url: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [preparingEncoding, setPreparingEncoding] = useState(false);
  const [enlargedIndex, setEnlargedIndex] = useState<number | null>(null);
  const [isCreatingEncoding, setIsCreatingEncoding] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pklExists, setPklExists] = useState(false);
  const [matchLoading, setMatchLoading] = useState(false);
  const [folderPassword, setFolderPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const qrRef = useRef<HTMLCanvasElement>(null);
  
  const bypassUrl = typeof window !== "undefined" && selectedFolderId
    ? `${window.location.origin}/client?folderId=${selectedFolderId}&bypass=1`
    : "";

  // Authentication check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authStatus = sessionStorage.getItem('isAuthenticated');
      if (authStatus !== 'true') {
        window.location.href = '/';
        return;
      }
    }
    fetchFolders();
  }, []);
  
  useEffect(() => {
    if (selectedFolderId) {
      fetchImages(selectedFolderId);
    }
  }, [selectedFolderId]);

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

  const filteredImages = displayImages.filter(image => 
    image.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  async function fetchFolders() {
    try {
      const response = await axios.get(`${BASE_URL}/api/folders`);
      setFolders(response.data.folders || []);
      console.log("Fetched folders:", response.data.folders);
    } catch (error) {
      console.error("Error fetching folders:", error);
      toast.error("Unable to load folders");
    }
  }

  function getGoogleDriveViewUrl(fileId: string) {
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  const handleSetFolderPassword = async () => {
    if (!folderPassword) {
      toast.error("Please enter a password");
      return;
    }
    
    try {
      const { error } = await supabase
        .from("folders")
        .upsert({
          folder_id: selectedFolderId,
          password: folderPassword,
          folder_name: folders.find((folder) => folder.id === selectedFolderId)?.name,
        });
      
      if (error) {
        console.error("Supabase Error:", error);
        toast.error("Failed to set password");
      } else {
        toast.success("Password set successfully");
        setShowPasswordInput(false);
        setFolderPassword("");
      }
    } catch (err) {
      console.error("Error setting password:", err);
      toast.error("Something went wrong");
    }
  };

  async function fetchImages(folderId: string) {
    try {
      const response = await axios.get(`${BASE_URL}/api/images?folder_id=${folderId}`);
      const transformedImages = response.data.images.map((img: any) => ({
        ...img,
        url: getGoogleDriveViewUrl(img.id),
      }));
      setAllImages(transformedImages);
      setDisplayImages(transformedImages);
      console.log("Fetched images:", transformedImages.length);
    } catch (error) {
      console.error("Error fetching images:", error);
      toast.error("Failed to load images");
    }
  }

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

  const handleMatch = async () => {
    if (!file || !selectedFolderId) {
      toast.error("Please select a folder and upload an image!");
      return;
    }

    setMatchLoading(true);
    setProgress(0);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder_id", selectedFolderId);

      const response = await fetch(`${BASE_URL}/api/match`, {
        method: "POST",
        body: formData,
      });

      if (response.status === 404) {
        const errorData = await response.json();
        toast.error(errorData.detail || "Encoding file not found. Please create it first.");
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let matchedImages: any[] = [];

      if (!reader) {
        toast.error("Connection failed.");
        return;
      }

      let fullText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        fullText += decoder.decode(value, { stream: true });
        const events = fullText.split("\n\n");
        fullText = events.pop() || "";
        
        for (const event of events) {
          const jsonLine = event.replace(/^data:\s*/, "");
          if (jsonLine) {
            try {
              const data = JSON.parse(jsonLine);
              if (data.progress !== undefined) {
                setProgress(data.progress);
              }
              if (data.images) {
                const matchedImageIds = data.images.map((img: any) => img.id);
                const res = await fetch(`${BASE_URL}/api/images?folder_id=${selectedFolderId}`);
                const imageData = await res.json();
                matchedImages = imageData.images.filter((img: any) =>
                  matchedImageIds.includes(img.id)
                );
              }
            } catch (parseError) {
              console.error("Error parsing SSE data:", parseError);
            }
          }
        }
      }
      
      setDisplayImages(matchedImages);
      toast.success(`Found ${matchedImages.length} matching images!`);
    } catch (err) {
      console.error("Error matching faces:", err);
      toast.error("Failed to match faces.");
    } finally {
      setMatchLoading(false);
      setProgress(0);
    }
  };

  const handleCreateEncoding = async () => {
    if (!selectedFolderId) {
      toast.error("Please select a folder first.");
      return;
    }
    
    setIsCreatingEncoding(true);
    try {
      const checkRes = await fetch(`${BASE_URL}/api/check_encoding_exists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder_id: selectedFolderId }),
      });
      
      const checkData = await checkRes.json();
      if (!checkRes.ok) throw new Error(checkData.error || "Failed to check encoding");
      
      if (checkData.exists) {
        setPklExists(true);
        setShowConfirmation(true);
      } else {
        await createEncoding();
      }
    } catch (error) {
      console.error("Error creating encoding:", error);
      toast.error("Something went wrong");
    } finally {
      setIsCreatingEncoding(false);
    }
  };

  const createEncoding = async () => {
    setIsCreatingEncoding(true);
    try {
      const res = await fetch(`${BASE_URL}/api/images?folder_id=${selectedFolderId}`);
      const data = await res.json();
      const images = data.images.map((img: any) => ({
        id: img.id,
        name: img.name,
        path_or_url: getGoogleDriveViewUrl(img.id),
      }));

      const createRes = await fetch(`${BASE_URL}/api/create_encoding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folder_id: selectedFolderId,
          images: images,
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error || "Encoding failed");
      
      toast.success(createData.status || "Encoding created successfully!");
      setPklExists(true);
    } catch (error) {
      console.error("Error creating encoding:", error);
      toast.error("Failed to create encoding");
    } finally {
      setIsCreatingEncoding(false);
      setShowConfirmation(false);
    }
  };

  const handleConfirmYes = async () => {
    try {
      setShowConfirmation(false);
      setIsCreatingEncoding(true);
      await deleteEncodings();
      await createEncoding();
    } catch (error) {
      toast.error("Failed to replace encoding");
      setIsCreatingEncoding(false);
    }
  };

  const deleteEncodings = async () => {
    if (!selectedFolderId) {
      toast.error("Please select a folder first.");
      return;
    }
    
    try {
      setDeleteLoading(true);
      const res = await fetch(`${BASE_URL}/api/delete_encoding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder_id: selectedFolderId }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete encoding");
      
      toast.success(data.status || "Encoding deleted successfully!");
      setPklExists(false);
    } catch (error) {
      console.error("Error deleting encoding:", error);
      toast.error("Failed to delete encoding");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleConfirmNo = () => {
    setShowConfirmation(false);
    setPklExists(false);
  };

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

      for (const fileId of imagesToProcess) {
        const metadataRes = await fetch(`${BASE_URL}/api/file-metadata?file_id=${fileId}`);
        if (!metadataRes.ok) throw new Error(`Failed to fetch metadata for ${fileId}`);
        const { name } = await metadataRes.json();

        const fileRes = await fetch(`${BASE_URL}/api/file-download?file_id=${fileId}`);
        if (!fileRes.ok) throw new Error(`Failed to download file ${fileId}`);
        const blob = await fileRes.blob();

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", name || `${fileId}.jpg`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      
      toast.success("Download complete!");
    } catch (error) {
      console.error("Error downloading files:", error);
      toast.error("Download failed.");
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

  return (
    <div className="min-h-screen bg-background transition-colors duration-300 relative overflow-hidden">
      <AnimatedBackground />
      <ParticleBackground />
      <Toaster 
        position="top-center" 
        toastOptions={{ 
          className: 'studio-glass text-foreground border border-border/50',
          duration: 4000
        }} 
      />
      
      {/* Navigation Header */}
      <header className="relative z-10 border-b border-border/50 studio-glass">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              <div className="relative">
                <motion.div
                  className="w-12 h-12 rounded-2xl studio-gradient flex items-center justify-center shadow-lg"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Camera className="w-6 h-6 text-background" />
                </motion.div>
                <motion.div
                  className="absolute -top-1 -right-1 w-4 h-4 bg-foreground rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-display font-bold studio-text-gradient">
                  Studio Admin
                </h1>
                <p className="text-sm text-muted-foreground">Professional Photography Management</p>
              </div>
            </motion.div>
            
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <ThemeToggle />
              </motion.div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Container */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center space-y-4 mb-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full studio-glass text-sm">
              <Settings className="w-4 h-4" />
              <span>Administrative Dashboard</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold">
              <span className="studio-text-gradient">Studio Management</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Manage portfolios, create AI encodings, and share galleries with advanced facial recognition technology
            </p>
          </motion.div>

          {/* Portfolio Selection Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            <div className="studio-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
                  <FolderSearch className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Portfolio Selection</h3>
                  <p className="text-sm text-muted-foreground">Choose a portfolio to manage</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Active Portfolio</label>
                  <motion.select
                    whileHover={{ scale: 1.01 }}
                    className="professional-select"
                    value={selectedFolderId}
                    onChange={(e) => {
                      setSelectedFolderId(e.target.value);
                      setShowQR(false);
                      setShowPasswordInput(false);
                    }}
                  >
                    <option value="">Select Portfolio...</option>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </motion.select>
                </div>
                
                {selectedFolderId && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex items-center gap-2 text-sm text-foreground"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Portfolio selected and ready for management</span>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Security Settings */}
          {selectedFolderId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="max-w-2xl mx-auto"
            >
              <div className="studio-card">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Security Settings</h3>
                    <p className="text-sm text-muted-foreground">Protect portfolio access</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {showPasswordInput ? (
                    <motion.div 
                      className="space-y-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">Access Passphrase</label>
                        <div className="relative">
                          <input
                            type={isPasswordVisible ? "text" : "password"}
                            placeholder="Enter secure passphrase"
                            className="professional-input pr-10"
                            value={folderPassword}
                            onChange={(e) => setFolderPassword(e.target.value)}
                          />
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {isPasswordVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </motion.button>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1 studio-button studio-gradient"
                          onClick={handleSetFolderPassword}
                        >
                          Set Password
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="studio-button"
                          onClick={() => setShowPasswordInput(false)}
                        >
                          Cancel
                        </motion.button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full studio-button group"
                      onClick={() => setShowPasswordInput(true)}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Shield className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>Configure Portfolio Security</span>
                      </div>
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* AI Processing & Management */}
          {selectedFolderId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              
              {/* Upload Preview */}
              {file && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-2xl mx-auto"
                >
                  <div className="studio-card">
                    <div className="flex items-center gap-4">
                      <img
                        src={URL.createObjectURL(file)}
                        className="w-16 h-16 object-cover rounded-lg border border-border"
                        alt="Upload preview"
                      />
                      <div className="flex-1">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-sm text-muted-foreground">{Math.round(file.size/1024)}KB</p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        onClick={() => setFile(null)}
                      >
                        <X className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Upload & AI Processing Card */}
              <div className="max-w-4xl mx-auto">
                <div className="studio-card">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">AI Processing</h3>
                      <p className="text-sm text-muted-foreground">Upload reference photo and process with AI</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* Upload Button */}
                    <div className="relative">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full p-4 studio-glass border border-border/50 hover:border-foreground/30 rounded-xl transition-all group"
                        onClick={() => document.getElementById('file-input')?.click()}
                      >
                        <Upload className="w-6 h-6 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                        <div className="text-sm font-medium">Upload Reference</div>
                        <div className="text-xs text-muted-foreground">Select master photo</div>
                      </motion.button>
                      
                      {file && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute -top-2 -right-2 w-10 h-10 rounded-full overflow-hidden border-2 border-foreground shadow-lg"
                        >
                          <img
                            src={URL.createObjectURL(file)}
                            className="w-full h-full object-cover"
                            alt="Upload preview"
                          />
                        </motion.div>
                      )}
                    </div>

                    {/* AI Match Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full p-4 studio-glass border border-border/50 hover:border-foreground/30 rounded-xl transition-all group"
                      onClick={async () => {
                        setMatchLoading(true);
                        await handleMatch();
                        setMatchLoading(false);
                        setFile(null);
                      }}
                      disabled={matchLoading}
                    >
                      {matchLoading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-6 h-6 mx-auto mb-2 border-2 border-muted-foreground/30 border-t-foreground rounded-full"
                        />
                      ) : (
                        <Search className="w-6 h-6 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                      )}
                      <div className="text-sm font-medium">
                        {matchLoading ? "Processing..." : "AI Match"}
                      </div>
                      <div className="text-xs text-muted-foreground">Find similar faces</div>
                    </motion.button>

                    {/* Select All Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full p-4 studio-glass border border-border/50 hover:border-foreground/30 rounded-xl transition-all group"
                      onClick={() => {
                        const allIds = new Set(filteredImages.map(img => img.id));
                        setSelectedImages(allIds);
                      }}
                    >
                      <CheckSquare className="w-6 h-6 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                      <div className="text-sm font-medium">Select All</div>
                      <div className="text-xs text-muted-foreground">Choose all photos</div>
                    </motion.button>

                    {/* Clear All Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full p-4 studio-glass border border-border/50 hover:border-destructive/50 rounded-xl transition-all group"
                      onClick={handleClearAll}
                    >
                      <XSquare className="w-6 h-6 mx-auto mb-2 group-hover:text-destructive group-hover:scale-110 transition-all" />
                      <div className="text-sm font-medium">Clear All</div>
                      <div className="text-xs text-muted-foreground">Reset selection</div>
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Selection Summary */}
              {selectedImages.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-2xl mx-auto"
                >
                  <div className="studio-card">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-semibold">{selectedImages.size} Photos Selected</div>
                          <div className="text-sm text-muted-foreground">Ready for download</div>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="studio-button studio-gradient flex items-center gap-2"
                        onClick={() => handleDownloadSelected()}
                        disabled={downloadLoading}
                      >
                        {downloadLoading ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full"
                            />
                            <span>Preparing...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-5 h-5" />
                            <span>Download Selected</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Encoding Management */}
              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {showConfirmation ? (
                    <div className="col-span-2 studio-card">
                      <p className="text-center text-lg mb-4">Existing encoding found. Replace it?</p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          className="studio-button bg-destructive text-destructive-foreground"
                          onClick={handleConfirmYes}
                        >
                          Yes, Replace
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          className="studio-button"
                          onClick={handleConfirmNo}
                        >
                          Cancel
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full p-4 studio-glass border border-border/50 hover:border-foreground/30 rounded-xl transition-all group"
                        onClick={handleCreateEncoding}
                        disabled={isCreatingEncoding}
                      >
                        {isCreatingEncoding ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-6 h-6 mx-auto mb-2 border-2 border-muted-foreground/30 border-t-foreground rounded-full"
                          />
                        ) : (
                          <Database className="w-6 h-6 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                        )}
                        <div className="text-sm font-medium">
                          {isCreatingEncoding ? "Creating..." : "Create Encoding"}
                        </div>
                        <div className="text-xs text-muted-foreground">AI facial recognition</div>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full p-4 studio-glass border border-border/50 hover:border-destructive/50 rounded-xl transition-all group"
                        onClick={deleteEncodings}
                        disabled={deleteLoading}
                      >
                        {deleteLoading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-6 h-6 mx-auto mb-2 border-2 border-muted-foreground/30 border-t-destructive rounded-full"
                          />
                        ) : (
                          <Trash2 className="w-6 h-6 mx-auto mb-2 group-hover:text-destructive group-hover:scale-110 transition-all" />
                        )}
                        <div className="text-sm font-medium">
                          {deleteLoading ? "Deleting..." : "Delete Encodings"}
                        </div>
                        <div className="text-xs text-muted-foreground">Remove AI data</div>
                      </motion.button>
                    </>
                  )}
                </div>
              </div>

              {/* QR Code Generation */}
              <div className="max-w-2xl mx-auto">
                <div className="studio-card">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <h3 className="text-lg font-semibold">Client Sharing</h3>
                  </div>
                  
                  {!showQR ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full studio-button studio-gradient"
                      onClick={() => setShowQR(true)}
                    >
                      Generate QR Code
                    </motion.button>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-background p-4 rounded-xl border border-border">
                        <QRCodeCanvas 
                          value={bypassUrl} 
                          size={160}
                          className="mx-auto"
                          ref={qrRef}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          className="studio-button text-xs"
                          onClick={handleDownloadQR}
                        >
                          Download
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          className="studio-button text-xs"
                          onClick={() => {
                            navigator.clipboard.writeText(bypassUrl);
                            toast.success("Link copied!");
                          }}
                        >
                          Copy Link
                        </motion.button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Gallery Section */}
          {selectedFolderId && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-6"
            >
              {/* Search Bar */}
              <div className="max-w-2xl mx-auto">
                <div className="studio-card">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                      <Search className="w-4 h-4" />
                    </div>
                    <h3 className="text-lg font-semibold">Search Photos</h3>
                  </div>
                  
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by name, date, or keywords..."
                      className="professional-input pl-12"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    {searchTerm && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>

              {/* Image Grid */}
              <div className="studio-card">
                {filteredImages.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                          <Grid3X3 className="w-4 h-4" />
                        </div>
                        <h3 className="text-lg font-semibold">Gallery ({filteredImages.length})</h3>
                      </div>
                      
                      {selectedImages.size > 0 && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center gap-3"
                        >
                          <span className="text-sm font-medium">
                            {selectedImages.size} selected
                          </span>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="studio-button studio-gradient text-sm"
                            onClick={() => handleDownloadSelected()}
                            disabled={downloadLoading}
                          >
                            {downloadLoading ? 'Preparing...' : 'Export Selected'}
                          </motion.button>
                        </motion.div>
                      )}
                    </div>
                    
                    <div className="image-gallery-grid">
                      {filteredImages.map((image, index) => (
                        <motion.div
                          key={image.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: Math.min(index * 0.03, 1), duration: 0.4 }}
                          className="relative group aspect-square hover-lift cursor-pointer"
                          onClick={() => setEnlargedIndex(index)}
                        >
                          {/* Skeleton loader */}
                          <div className="absolute inset-0 skeleton rounded-2xl" />
                          
                          {/* Image container */}
                          <div className="relative w-full h-full rounded-2xl overflow-hidden border border-border/50 studio-glass">
                            <img
                              src={`https://drive.google.com/thumbnail?id=${image.id}&sz=w300`}
                              alt={image.name}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover transition-all duration-500 opacity-0 group-hover:scale-105"
                              onLoad={(e) => {
                                const img = e.target as HTMLImageElement;
                                img.classList.remove('opacity-0');
                                img.classList.add('opacity-100');
                              }}
                            />
                            
                            {/* Overlay gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />

                            {/* Selection checkbox */}
                            <motion.div 
                              className="absolute top-3 left-3 z-10"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={selectedImages.has(image.id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleSelectImage(image.id);
                                }}
                                className="w-5 h-5 rounded-lg border-2 border-white/70 bg-white/10 backdrop-blur checked:bg-foreground checked:border-foreground cursor-pointer transition-all"
                              />
                            </motion.div>

                            {/* Preview indicator */}
                            <div className="absolute bottom-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300">
                              <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                                <Maximize2 className="w-4 h-4 text-white" />
                              </div>
                            </div>

                            {/* Image info */}
                            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                              <p className="text-white text-sm font-medium truncate">
                                {image.name}
                              </p>
                            </div>

                            {/* Selected indicator */}
                            {selectedImages.has(image.id) && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute inset-0 bg-foreground/20 border-2 border-foreground rounded-2xl"
                              />
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="py-16 text-center">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center">
                        <FolderSearch className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold">No photos found</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        {searchTerm 
                          ? `No photos match "${searchTerm}". Try adjusting your search.`
                          : "This portfolio is empty. Upload some photos to get started."
                        }
                      </p>
                    </motion.div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Footer */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-16 text-center text-muted-foreground text-sm space-y-2"
          >
            <p>© {new Date().getFullYear()} Leo Photography Studio. All rights reserved.</p>
            <p>Professional photography management with AI-powered facial recognition</p>
          </motion.footer>
        </motion.div>
      </div>

      {/* Enhanced Lightbox Modal */}
      <AnimatePresence>
        {enlargedIndex !== null && (
          <motion.div
            className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEnlargedIndex(null)}
          >
            {/* Navigation buttons */}
            {enlargedIndex > 0 && (
              <motion.button
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 studio-glass rounded-full flex items-center justify-center hover:bg-white/20 z-20 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setEnlargedIndex(enlargedIndex - 1);
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
              >
                <ChevronLeft className="w-6 h-6" />
              </motion.button>
            )}
            
            {enlargedIndex < filteredImages.length - 1 && (
              <motion.button
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 studio-glass rounded-full flex items-center justify-center hover:bg-white/20 z-20 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setEnlargedIndex(enlargedIndex + 1);
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
              >
                <ChevronRight className="w-6 h-6" />
              </motion.button>
            )}

            {/* Close button */}
            <motion.button
              className="absolute top-4 right-4 w-10 h-10 studio-glass rounded-full flex items-center justify-center hover:bg-white/20 z-20 text-white"
              onClick={() => setEnlargedIndex(null)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <X className="w-5 h-5" />
            </motion.button>

            {/* Main content */}
            <motion.div
              className="studio-glass rounded-3xl overflow-hidden shadow-2xl max-w-5xl w-full border border-white/10"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
            >
              <iframe
                src={`https://drive.google.com/file/d/${filteredImages[enlargedIndex]?.id}/preview`}
                className="w-full aspect-video"
                allow="autoplay"
              />
              
              {/* Controls */}
              <div className="p-6 bg-card/80 backdrop-blur border-t border-border/50">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${
                        selectedImages.has(filteredImages[enlargedIndex]?.id) 
                          ? 'bg-foreground/20 text-foreground border border-foreground/30' 
                          : 'studio-glass border border-border/50 hover:border-border'
                      }`}
                      onClick={() => toggleSelectImage(filteredImages[enlargedIndex]?.id)}
                    >
                      {selectedImages.has(filteredImages[enlargedIndex]?.id) ? (
                        <CheckSquare className="w-5 h-5" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                      <span className="font-medium">{filteredImages[enlargedIndex]?.name}</span>
                    </motion.button>
                  </div>
                  
                  <div className="flex gap-3 w-full sm:w-auto">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 sm:flex-none studio-button studio-gradient"
                      onClick={() => handleDownloadSelected(new Set([filteredImages[enlargedIndex]?.id]))}
                    >
                      <div className="flex items-center gap-2 justify-center">
                        <Download className="w-5 h-5" />
                        <span>Download</span>
                      </div>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden File Input */}
      <input
        type="file"
        id="file-input"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="hidden"
      />
    </div>
  );
}