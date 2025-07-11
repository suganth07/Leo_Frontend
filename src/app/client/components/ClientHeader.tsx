"use client";

import { motion } from "framer-motion";
import { FolderOpen } from "lucide-react";

const ClientHeader = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="text-center space-y-2 mb-8"
    >
      <div className="flex items-center justify-center gap-2 mb-4">
        <FolderOpen className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Photo Gallery</h1>
      </div>
      <p className="text-muted-foreground text-lg">
        Find and download your photos using AI-powered face recognition
      </p>
    </motion.div>
  );
};

export default ClientHeader;
