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
        {/* <FolderOpen className="h-8 w-8 text-primary" /> */}
        <img src="/logo.png" alt="Leo Logo" className="h-15 w-15 color-white" />
        <h1 className="text-3xl font-bold">Leo Photo Gallery - Client Portal</h1>
      </div>
    </motion.div>
  );
};

export default ClientHeader;
