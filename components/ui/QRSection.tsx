'use client';

import { motion } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Link2 } from 'lucide-react';
import { useRef } from 'react';
import { toast } from 'react-hot-toast';

interface QRSectionProps {
  url: string;
  onDownload?: () => void;
  title?: string;
}

export default function QRSection({ url, onDownload, title = "QR Code" }: QRSectionProps) {
  const qrRef = useRef<HTMLCanvasElement>(null);

  const handleDownloadQR = () => {
    const canvas = qrRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL("image/jpeg");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "qr-code.jpg";
      a.click();
    }
    if (onDownload) {
      onDownload();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="p-4 bg-black/40 rounded-xl border border-white/10">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
          <span className="font-medium text-gray-200 text-lg">{title}</span>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center gap-2 font-medium w-full"
              onClick={handleDownloadQR}
            >
              <Download size={16} />
              Download QR Code
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center justify-center gap-2 font-medium w-full"
              onClick={handleCopyLink}
            >
              <Link2 size={16} />
              Copy Share Link
            </motion.button>
          </div>
        </div>
        <div className="flex justify-center">
          <QRCodeCanvas 
            value={url} 
            size={160}
            bgColor="transparent"
            fgColor="#ffffff"
            className="border-4 border-white rounded-lg"
            ref={qrRef}
          />
        </div>
      </div>
    </motion.div>
  );
}