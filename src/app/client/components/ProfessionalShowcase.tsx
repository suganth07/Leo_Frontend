"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Camera, 
  Sparkles, 
  TrendingUp, 
  Clock, 
  Users, 
  Heart,
  Star,
  Award,
  Zap
} from "lucide-react";

interface ShowcaseStats {
  totalCollections: number;
  totalPhotos: number;
  recentlyAdded: number;
  featuredCollection?: string;
}

interface ProfessionalShowcaseProps {
  stats: ShowcaseStats;
}

export default function ProfessionalShowcase({ stats }: ProfessionalShowcaseProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const showcaseFeatures = [
    {
      icon: Camera,
      title: "Professional Quality",
      description: "High-resolution photos with advanced face recognition",
      color: "text-blue-600"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Instant photo search and AI-powered matching",
      color: "text-yellow-600"
    },
    {
      icon: Heart,
      title: "Cherished Memories",
      description: "Find yourself in thousands of captured moments",
      color: "text-red-600"
    },
    {
      icon: Award,
      title: "Premium Experience",
      description: "Professional photography services with modern tech",
      color: "text-purple-600"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-4"
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
            <Camera className="h-6 w-6 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Photography Gallery
            </h1>
            <p className="text-muted-foreground text-sm">Professional moments, beautifully captured</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            AI-Powered Search
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Latest Technology
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Real-time Updates
          </Badge>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center mx-auto mb-2">
              <Camera className="h-5 w-5 text-white" />
            </div>
            <div className="text-2xl font-bold text-blue-700">{stats.totalCollections}</div>
            <div className="text-sm text-blue-600">Photo Collections</div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100/50">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center mx-auto mb-2">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div className="text-2xl font-bold text-green-700">{stats.totalPhotos.toLocaleString()}</div>
            <div className="text-sm text-green-600">Total Photos</div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center mx-auto mb-2">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="text-2xl font-bold text-purple-700">{stats.recentlyAdded}</div>
            <div className="text-sm text-purple-600">Recently Added</div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center mx-auto mb-2">
              <Star className="h-5 w-5 text-white" />
            </div>
            <div className="text-2xl font-bold text-amber-700">4.9</div>
            <div className="text-sm text-amber-600">Client Rating</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Features Showcase */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="grid md:grid-cols-2 gap-6"
      >
        {showcaseFeatures.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
          >
            <Card className="border-muted/50 hover:border-primary/30 transition-colors h-full">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center ${feature.color}`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Live Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="text-center"
      >
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-2 text-green-700">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium">Live Gallery</span>
              <span className="text-green-600">•</span>
              <span className="text-sm">
                Last updated {currentTime.toLocaleTimeString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
