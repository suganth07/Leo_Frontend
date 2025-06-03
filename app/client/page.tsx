"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, Download, Search, Upload, XCircle, CheckCircle, Eye, EyeOff, 
  ChevronLeft, Square, CheckSquare, X, Maximize2, ChevronRight, FolderSearch, 
  Camera, User, Shield, Sparkles, Lock, Grid3X3
} from "lucide-react";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import ParticleBackground from "@/components/ui/ParticleBackground";
import ThemeToggle from "@/components/ui/ThemeToggle";

// Supabase configuration with fallbacks
const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fallback-key';
const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fallback.supabase.co';

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY);
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL; 

console.log("Client Page - BASE_URL:", BASE_URL);

export default function ClientPage() {
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
  const [enlargedIndex, setEnlargedIndex] = useState<number | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [folderPassword, setFolderPassword] = useState("");
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  type Folder = { id: string; name: string };

  useEffect(() => {
    async function fetchFolders() {
      try {
        const res = await axios.get<{ folders: Folder[] }>(
          `${BASE_URL}/api/folders`
        );
        setFolders(res.data.folders ?? []);
        console.log("Fetched folders:", res.data.folders);
      } catch (error) {
        console.error("Error fetching folders:", error);
        toast.error("Unable to load folders");
      }
    }
    if (BASE_URL) fetchFolders();
    else console.warn("BASE_URL is not set");
  }, [BASE_URL]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const folderId = params.get("folderId");
    const bypass = params.get("bypass");

    if (folderId) {
      setSelectedFolderId(folderId);
      if (bypass === "1") {
        setIsPasswordVerified(true);
        fetchImages(folderId);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedFolderId && isPasswordVerified) {
      fetchImages(selectedFolderId);
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

  const filteredImages = displayImages.filter(image => 
    image.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  async function fetchImages(folderId: string) {
    try {
      const response = await axios.get(`${BASE_URL}/api/images?folder_id=${folderId}`);
      setAllImages(response.data.images);
      setDisplayImages(response.data.images);
      console.log("Fetched images:", response.data.images.length);
    } catch (error) {
      console.error("Error fetching images:", error);
      toast.error("Failed to load images");
    }
  }

  async function handleMatch() {
    if (!file || !selectedFolderId) {
      toast.error("Please select a folder and upload an image!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder_id", selectedFolderId);

    try {
      setLoading(true);
      setProgress(0);
      
      const response = await fetch(`${BASE_URL}/api/match`, {
        method: "POST",
        body: formData,
      });

      if (response.status === 404) {
        const errorData = await response.json();
        toast.error(errorData.error || "Encoding file not found. Please contact administrator.");
        return;
      }

      if (!response.ok || !response.body) {
        throw new Error("No response body from server");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let receivedText = "";
      let allMatchedImages: { id: string; name: string; url: string }[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        receivedText += decoder.decode(value, { stream: true });
        const events = receivedText.split("\n\n");
        receivedText = events.pop() || "";
        for (const event of events) {
          if (event.startsWith("data: ")) {
            const parsed = JSON.parse(event.replace("data: ", ""));
            if (parsed.progress !== undefined) setProgress(parsed.progress);
            if (parsed.images) allMatchedImages = parsed.images;
          }
        }
      }

      setDisplayImages(allMatchedImages);
      toast.success(`Found ${allMatchedImages.length} matching photos!`);
    } catch (error) {
      console.error("Error matching faces:", error);
      toast.error("Failed to match faces. Try again.");
    } finally {
      setLoading(false);
      setProgress(0);
    }
  }

  async function verifyFolderPassword() {
    if (!selectedFolderId || !folderPassword) {
      toast.error("Please enter a password.");
      return;
    }

    try {
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

      if (data.password === folderPassword) {
        toast.success("Access granted!");
        setIsPasswordVerified(true);
        fetchImages(selectedFolderId);
      } else {
        toast.error("Incorrect password. Try again.");
      }
    } catch (err) {
      console.error("Error verifying password:", err);
      toast.error("Something went wrong.");
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
                  Client Portal
                </h1>
                <p className="text-sm text-muted-foreground">Leo Photography Studio</p>
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
            </div>
          </div>
        </div>
      </header>
      
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
              <User className="w-4 h-4" />
              <span>Client Portal</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold">
              <span className="studio-text-gradient">Your Photo Gallery</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Access your personalized photo collection with AI-powered facial recognition. 
              Find your photos instantly and download your favorites.
            </p>
          </motion.div>

          {/* Portfolio Selection */}
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
                  <h3 className="text-lg font-semibold">Select Portfolio</h3>
                  <p className="text-sm text-muted-foreground">Choose your photo collection</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <motion.select
                  whileHover={{ scale: 1.01 }}
                  value={selectedFolderId}
                  onChange={(e) => {
                    setSelectedFolderId(e.target.value);
                    setIsPasswordVerified(false);
                    setDisplayImages([]);
                  }}
                  className="professional-select text-center"
                >
                  <option value="">Choose your portfolio...</option>
                  {folders?.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </motion.select>
                
                {selectedFolderId && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex items-center gap-2 text-sm text-foreground"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Portfolio selected</span>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Password Verification */}
          {selectedFolderId && !isPasswordVerified && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="max-w-md mx-auto"
            >
              <div className="studio-card">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Access Verification</h3>
                    <p className="text-sm text-muted-foreground">Enter your access code</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type={isPasswordVisible ? "text" : "password"}
                      placeholder="Enter your access passphrase"
                      value={folderPassword}
                      onChange={(e) => setFolderPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && verifyFolderPassword()}
                      className="professional-input pr-12"
                    />
                    <motion.button
                      type="button"
                      onClick={() => setIsPasswordVisible(prev => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {isPasswordVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </motion.button>
                  </div>
      
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={verifyFolderPassword}
                    className="w-full py-4 studio-gradient text-background rounded-xl font-semibold animate-professional-glow transition-all"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Lock className="w-5 h-5" />
                      <span>Access Gallery</span>
                    </div>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Main Controls */}
          {selectedFolderId && isPasswordVerified && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              
              {/* AI Photo Matching */}
              <div className="max-w-4xl mx-auto">
                <div className="studio-card">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">AI Photo Finder</h3>
                      <p className="text-sm text-muted-foreground">Upload your photo to find all similar images</p>
                    </div>
                  </div>
                  
                  {/* Upload Preview */}
                  {file && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mb-6 studio-glass rounded-xl p-4 border border-border/50"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={URL.createObjectURL(file)}
                          className="w-16 h-16 object-cover rounded-lg"
                          alt="Upload preview"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{file.name}</p>
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
                    </motion.div>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* Upload Button */}
                    <div className="relative">
                      <motion.label
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="block w-full p-4 studio-glass border border-border/50 hover:border-foreground/30 rounded-xl transition-all cursor-pointer group"
                      >
                        <Upload className="w-6 h-6 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                        <div className="text-sm font-medium">Upload Photo</div>
                        <div className="text-xs text-muted-foreground">Find your photos</div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setFile(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                      </motion.label>
                      
                      {file && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute -top-2 -right-2 w-8 h-8 rounded-full overflow-hidden border-2 border-foreground shadow-lg"
                        >
                          <img 
                            src={URL.createObjectURL(file)} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                          />
                        </motion.div>
                      )}
                    </div>

                    {/* AI Search Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={async () => {
                        setMatchLoading(true);
                        await handleMatch();
                        setMatchLoading(false);
                        setFile(null);
                      }}
                      disabled={matchLoading}
                      className="w-full p-4 studio-glass border border-border/50 hover:border-foreground/30 rounded-xl transition-all group"
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
                        {matchLoading ? "Searching..." : "Find My Photos"}
                      </div>
                      <div className="text-xs text-muted-foreground">AI-powered match</div>
                    </motion.button>

                    {/* Select All Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSelectAll}
                      className="w-full p-4 studio-glass border border-border/50 hover:border-foreground/30 rounded-xl transition-all group"
                    >
                      <CheckCircle className="w-6 h-6 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                      <div className="text-sm font-medium">Select All</div>
                      <div className="text-xs text-muted-foreground">Choose all photos</div>
                    </motion.button>

                    {/* Clear Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleClearAll}
                      className="w-full p-4 studio-glass border border-border/50 hover:border-destructive/50 rounded-xl transition-all group"
                    >
                      <XCircle className="w-6 h-6 mx-auto mb-2 group-hover:text-destructive group-hover:scale-110 transition-all" />
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
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by name, date, or keywords..."
                      className="professional-input pl-12"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    {searchTerm && (
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setSearchTerm('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
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
              <div className="studio-card">
                {filteredImages.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                          <Grid3X3 className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">Your Photos ({filteredImages.length})</h3>
                          <p className="text-sm text-muted-foreground">
                            {searchTerm ? `Filtered results for "${searchTerm}"` : "Complete photo collection"}
                          </p>
                        </div>
                      </div>
                      
                      {selectedImages.size > 0 && (
                        <div className="text-sm font-medium">
                          {selectedImages.size} selected
                        </div>
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
                              className="w-full h-full object-cover transition-all duration-500 opacity-0 group-hover:scale-110"
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
                          ? `No photos match "${searchTerm}". Try a different search term.`
                          : "Upload a reference photo to find your images using AI-powered facial recognition."
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
            <p>Powered by advanced AI facial recognition technology</p>
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
                        <span>Download Photo</span>
                      </div>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}