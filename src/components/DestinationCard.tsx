"use client";
import { motion } from "framer-motion";
import { MapPin, Star, ArrowRight, Clock } from "lucide-react";

export default function DestinationCard({ name, summary, tags, onSelect }:{
  name: string; summary?: string; tags?: string[]; onSelect?: ()=>void;
}){
  // Get a random destination image with beautiful overlays
  const getDestinationImage = (name: string) => {
    // List of all available images
    const images = [
      'licensed-image.jpeg',
      'licensed-image (1).jpeg',
      'licensed-image (2).jpeg',
      'licensed-image (3).jpeg',
      'licensed-image (4).jpeg',
      'licensed-image (5).jpeg',
      'licensed-image (6).jpeg',
      'licensed-image (7).jpeg',
      'licensed-image (8).jpeg',
      'licensed-image (9).jpeg',
      'licensed-image (10).jpeg',
      'licensed-image (11).jpeg',
      'licensed-image (12).jpeg',
      'licensed-image (13).jpeg',
      'licensed-image (14).jpeg',
      'licensed-image (15).jpeg',
      'licensed-image (16).jpeg',
      'licensed-image (17).jpeg',
      'licensed-image (18).jpeg',
      'licensed-image (19).jpeg'
    ];

    // Create a hash from the destination name for consistent image assignment
    const getImageIndex = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash) % images.length;
    };

    const selectedImage = images[getImageIndex(name)];
    
    // Different overlay gradients for variety
    const overlays = [
      'linear-gradient(135deg, rgba(255, 107, 53, 0.65), rgba(0, 0, 0, 0.4))',
      'linear-gradient(135deg, rgba(59, 130, 246, 0.6), rgba(0, 0, 0, 0.45))',
      'linear-gradient(135deg, rgba(147, 51, 234, 0.6), rgba(0, 0, 0, 0.4))',
      'linear-gradient(135deg, rgba(34, 197, 94, 0.6), rgba(0, 0, 0, 0.4))',
      'linear-gradient(135deg, rgba(255, 193, 7, 0.65), rgba(0, 0, 0, 0.4))',
      'linear-gradient(135deg, rgba(236, 72, 153, 0.6), rgba(0, 0, 0, 0.45))',
      'linear-gradient(135deg, rgba(239, 68, 68, 0.6), rgba(0, 0, 0, 0.4))',
      'linear-gradient(135deg, rgba(16, 185, 129, 0.6), rgba(0, 0, 0, 0.4))'
    ];

    const overlayIndex = getImageIndex(name + 'overlay') % overlays.length;
    const selectedOverlay = overlays[overlayIndex];

    return `${selectedOverlay}, url("/images/destinations/${selectedImage}")`;
  };

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="destination-card group cursor-pointer relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
      onClick={onSelect}
      style={{
        backgroundImage: getDestinationImage(name),
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '300px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Enhanced overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent group-hover:from-black/70 transition-all duration-300" />
      
      {/* Subtle shimmer effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-700" />
      <div className="relative z-10 h-full flex flex-col p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2 text-white/90 backdrop-blur-sm bg-black/20 px-3 py-1 rounded-full border border-white/20">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">Destination</span>
          </div>
          
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            className="bg-white/20 backdrop-blur-md rounded-full p-2.5 border border-white/30 group-hover:bg-white/30 group-hover:border-white/50 transition-all duration-300 shadow-lg"
          >
            <ArrowRight className="w-4 h-4 text-white drop-shadow-sm" />
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-end">
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 group-hover:text-orange-100 transition-colors drop-shadow-lg">
            {name}
          </h3>
          
          {summary && (
            <p className="text-white/95 text-sm mb-4 leading-relaxed group-hover:text-white transition-colors backdrop-blur-sm bg-black/10 p-3 rounded-lg border border-white/10">
              {summary}
            </p>
          )}

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.slice(0, 3).map((tag, index) => (
                <motion.span 
                  key={tag}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full border border-white/20 font-medium group-hover:bg-white/30 transition-all duration-300"
                >
                  #{tag}
                </motion.span>
              ))}
            </div>
          )}

          {/* Call to Action */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-white/90 backdrop-blur-sm bg-black/20 px-3 py-2 rounded-lg border border-white/20">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Plan your trip</span>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white/95 backdrop-blur-sm text-gray-800 px-5 py-2.5 rounded-xl font-semibold text-sm shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:bg-white border border-white/20 hover:border-orange-200"
            >
              Select
            </motion.button>
          </div>
        </div>

        {/* Enhanced bottom accent with blur */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 shadow-lg" />
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-orange-400/20 via-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
      </div>
    </motion.div>
  );
}