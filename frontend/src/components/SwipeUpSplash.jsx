import React from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { ChevronUp, Utensils, Sparkles, Flame } from "lucide-react";

export default function SwipeUpSplash({ onUnlock }) {
  const y = useMotionValue(0);

  // Background opacity & blur changes as user swipes up
  const opacity = useTransform(y, [0, -200], [1, 0]);
  const scale = useTransform(y, [0, -200], [1, 0.9]);

  // Trigger unlock when user swipes up past threshold (-120px)
  const handleDragEnd = (_, info) => {
    if (info.offset.y < -120 || info.velocity.y < -300) {
      onUnlock();
    }
  };

  return (
    <motion.div
      style={{ opacity, scale }}
      className="fixed inset-0 z-50 flex flex-col justify-between items-center bg-stone-950 text-white p-6 overflow-hidden select-none"
    >
      {/* Ambient Background Glows */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-rose-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Badge */}
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="mt-8 flex items-center gap-2 bg-stone-900/80 border border-stone-800 px-4 py-1.5 rounded-full text-xs text-amber-400 font-semibold backdrop-blur-md shadow-lg"
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
        <span>SMART DIGITAL DINING EXPERIENCE</span>
      </motion.div>

      {/* Central Branding & Hero Content */}
      <div className="text-center z-10 my-auto flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, type: "spring", stiffness: 100 }}
          className="relative mb-6"
        >
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-500 to-rose-600 p-0.5 shadow-2xl shadow-rose-600/30">
            <div className="w-full h-full bg-stone-900 rounded-[22px] flex items-center justify-center">
              <Utensils className="w-12 h-12 text-amber-400" />
            </div>
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
          </span>
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-rose-500"
        >
          THE RICE BOWL
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-stone-400 text-sm mt-2 font-medium tracking-wide flex items-center gap-1.5"
        >
          <Flame className="w-4 h-4 text-rose-500" /> Freshly Prepared Gourmet Bowls
        </motion.p>
      </div>

      {/* Draggable Swipe-Up Interactive Handle */}
      <motion.div
        drag="y"
        dragConstraints={{ top: -180, bottom: 0 }}
        dragElastic={0.2}
        dragSnapToOrigin={true}
        onDragEnd={handleDragEnd}
        style={{ y }}
        className="w-full max-w-xs cursor-grab active:cursor-grabbing mb-6 flex flex-col items-center gap-3 touch-none z-20"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 shadow-lg backdrop-blur-md"
        >
          <ChevronUp className="w-6 h-6" />
        </motion.div>

        <div className="bg-stone-900/90 border border-stone-800 px-6 py-3 rounded-full text-xs font-bold text-stone-300 tracking-wider uppercase shadow-xl backdrop-blur-md flex items-center gap-2">
          <span>SWIPE UP TO ORDER</span>
        </div>
      </motion.div>
    </motion.div>
  );
}