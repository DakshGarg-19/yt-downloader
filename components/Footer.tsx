"use client";

import { motion, Variants } from "framer-motion";
import { Link2, BarChart3, Settings2, Download } from "lucide-react";

interface Step {
  number: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const steps: Step[] = [
  {
    number: "01",
    title: "PASTE",
    description: "Drop any YouTube URL into the capture field. Playlists, shorts, and full videos — we handle it all.",
    icon: Link2,
  },
  {
    number: "02",
    title: "ANALYZE",
    description: "Our engine extracts every available format, resolution, and codec in milliseconds.",
    icon: BarChart3,
  },
  {
    number: "03",
    title: "SELECT FORMAT",
    description: "Choose your preferred quality — from crystal-clear 4K video to lossless audio.",
    icon: Settings2,
  },
  {
    number: "04",
    title: "DOWNLOAD",
    description: "One click. Direct download. No redirects, no ads, no waiting rooms.",
    icon: Download,
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 200,
    },
  },
};

export default function Footer() {
  return (
    <footer className="relative bg-background border-t border-white/[0.04] overflow-hidden">
      {/* Background Element */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-yt-red/[0.03] rounded-full blur-[150px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 sm:px-12 py-20 sm:py-32">
        {/* Section Label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16 sm:mb-24"
        >
          <span className="text-xs uppercase tracking-[0.3em] text-yt-red font-semibold">
            How It Works
          </span>
          <h2 className="font-display font-bold text-3xl sm:text-5xl text-white mt-3">
            Four steps.
            <br />
            <span className="text-muted">Zero friction.</span>
          </h2>
        </motion.div>

        {/* Steps Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-6"
        >
          {steps.map((step) => (
            <motion.div
              key={step.number}
              variants={itemVariants}
              className="relative group"
            >
              {/* Large Number */}
              <div className="relative mb-6">
                <span className="font-display font-extrabold text-7xl sm:text-8xl lg:text-9xl italic text-yt-red/10 leading-none select-none group-hover:text-yt-red/20 transition-colors duration-500">
                  {step.number}
                </span>
                <div className="absolute bottom-2 left-1">
                  <step.icon className="w-6 h-6 text-yt-red opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>

              {/* Title */}
              <h3 className="font-display font-bold text-lg sm:text-xl text-white mb-3 tracking-tight group-hover:text-yt-red transition-colors duration-300">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-muted leading-relaxed">
                {step.description}
              </p>

              {/* Underline accent */}
              <div className="mt-6 w-8 h-0.5 bg-white/10 group-hover:w-16 group-hover:bg-yt-red transition-all duration-500" />
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom Bar */}
        <div className="mt-20 sm:mt-32 pt-8 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-yt-red animate-pulse" />
            <span className="font-display font-bold text-lg tracking-tight text-white">
              KODEX
            </span>
            <span className="text-muted text-sm">— YT Downloader</span>
          </div>

          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} KODEX. Built for creators, by
            creators.
          </p>

          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-xs text-muted hover:text-white transition-colors duration-200"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-xs text-muted hover:text-white transition-colors duration-200"
            >
              Terms
            </a>
            <a
              href="#"
              className="text-xs text-muted hover:text-white transition-colors duration-200"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
