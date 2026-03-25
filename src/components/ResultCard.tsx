"use client";

import { useState } from "react";
import { motion, Variants } from "framer-motion";
import { Download, Film, Music, Sparkles, RotateCcw } from "lucide-react";
import Image from "next/image";

/* ─── Types ──────────────────────────────────────────────────────────────── */
export interface FormatOption {
  format_id: string;
  quality: string;
  mimeType: string;
  size: string;
  badge?: string;
  isMerged?: boolean;
  isBest?: boolean;
}

export interface ResultData {
  originalUrl: string;
  videoId: string;
  thumbnail: string;
  title: string;
  channel: string;
  duration: string;
  formatCount: number;
  videoFormats: FormatOption[];
  audioFormats: FormatOption[];
}

interface ResultCardProps {
  data: ResultData;
  onReset: () => void;
}

/* ─── Animations ─────────────────────────────────────────────────────────── */
const listVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.15 },
  },
};
const rowVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", damping: 22, stiffness: 300 },
  },
};

/* ─── Badge Component ────────────────────────────────────────────────────── */
function Badge({ fmt, type }: { fmt: FormatOption; type: 'video' | 'audio' }) {
  // Logic from prompt: acodec and vcodec check is usually done on the backend info route.
  // The 'badge' or 'isMerged' property from our api/info is where we check this.
  const isMerged = fmt.isMerged || fmt.badge === 'MERGED';

  return (
    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest ml-2 ${
      isMerged && type === 'video'
        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
        : "bg-white/5 text-white/40 border-white/10"
    }`}>
      {type === 'video' ? (isMerged ? "MERGED" : "VIDEO ONLY") : "AUDIO"}
    </span>
  );
}

/* ─── Format Row ─────────────────────────────────────────────────────────── */
function FormatRow({
  fmt,
  videoId,
  icon: Icon,
  hoverColor,
  index,
  type,
  onDownload,
  progress,
  isDownloading
}: {
  fmt: FormatOption;
  videoId: string;
  icon: typeof Film;
  hoverColor: string;
  index: number;
  type: 'video' | 'audio';
  onDownload: (fmt: FormatOption) => void;
  progress: number;
  isDownloading: boolean;
}) {
  const ext = fmt.mimeType?.includes("webm")
    ? "WEBM"
    : fmt.mimeType?.includes("mp4")
    ? "MP4"
    : fmt.mimeType?.includes("m4a")
    ? "M4A"
    : "MP4";

  return (
    <motion.div
      variants={rowVariants}
      whileHover={{ x: 3, backgroundColor: "rgba(255,255,255,0.05)" }}
      className={`relative w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-colors duration-150 group text-left ${index === 0 ? 'ring-1 ring-yt-red/30 bg-yt-red/5 border-yt-red/20' : 'bg-white/4 border-white/6'}`}
    >
      {index === 0 && <span className="absolute -left-1 top-4 bottom-4 w-1 bg-yt-red rounded-r-full" />}
      {/* Left */}
      <div className="flex items-center min-w-0">
        <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-white/50" />
        </div>
        <div className="ml-3 min-w-0">
          <div className="flex items-center flex-wrap gap-1">
            <span className="text-sm font-bold text-white">{fmt.quality}</span>
            <Badge fmt={fmt} type={type} />
          </div>
          <p className="text-[11px] text-white/40 mt-0.5">
            {fmt.mimeType} · {fmt.size}
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3 ml-4 shrink-0">
        <span className="text-[10px] font-mono text-white/30 hidden sm:block">
          {ext}
        </span>
        <button
          onClick={() => onDownload(fmt)}
          disabled={isDownloading}
          className={`w-10 h-10 rounded-lg bg-white/4 ${hoverColor} flex items-center justify-center transition-colors duration-200 group relative disabled:opacity-50`}
        >
          {isDownloading ? (
             <div className="relative w-6 h-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    fill="transparent"
                    className="text-white/10"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    fill="transparent"
                    strokeDasharray={62.8}
                    strokeDashoffset={62.8 - (62.8 * progress) / 100}
                    strokeLinecap="round"
                    className="text-white transition-all duration-300"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold">
                  {progress}%
                </span>
             </div>
          ) : (
            <Download className="w-4 h-4 text-white/40 group-hover:text-white transition-colors duration-200" />
          )}
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function ResultCard({ data, onReset }: ResultCardProps) {
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [isDownloading, setIsDownloading] = useState<Record<string, boolean>>({});

  const handleDownload = async (fmt: FormatOption) => {
    const formatId = fmt.format_id;
    if (isDownloading[formatId]) return;

    setIsDownloading(prev => ({ ...prev, [formatId]: true }));
    setDownloadProgress(prev => ({ ...prev, [formatId]: 0 }));

    try {
      const response = await fetch(`/api/download?videoId=${encodeURIComponent(data.videoId)}&format_id=${encodeURIComponent(formatId)}`);
      
      if (!response.ok) throw new Error("Server error during download");

      const totalLength = Number(response.headers.get('Content-Length'));
      const reader = response.body?.getReader();
      if (!reader) throw new Error("Stream not available");

      let receivedLength = 0;
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        chunks.push(value);
        receivedLength += value.length;
        
        if (totalLength) {
          const percent = Math.round((receivedLength / totalLength) * 100);
          setDownloadProgress(prev => ({ ...prev, [formatId]: percent }));
        }
      }

      const blob = new Blob(chunks as any as BlobPart[]);
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${data.title.replace(/[^\w\s-]/gi, '')}_${fmt.quality}.${fmt.mimeType.split('/')[1] || 'mp4'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

    } catch (error) {
      console.error("Download failed:", error);
      alert("Proxy download failed. This can happen with very large files in a browser memory.");
    } finally {
      setIsDownloading(prev => ({ ...prev, [formatId]: false }));
    }
  };
  return (
    <motion.div
      className="w-full max-w-5xl mx-auto"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ type: "spring", damping: 26, stiffness: 220 }}
    >
      <div
        className="rounded-3xl border border-white/10 overflow-visible"
        style={{
          background: "rgba(10,10,10,0.9)",
          backdropFilter: "blur(24px)",
        }}
      >
        <div className="p-6 sm:p-8">
          {/* ═══════════════ ROW 1: Header + Info ═══════════════ */}
          <div className="flex flex-col lg:flex-row lg:items-start gap-6 mb-6">
            {/* Left: Header + Thumbnail/Meta */}
            <div className="flex-1 min-w-0">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <p className="text-[10px] uppercase tracking-[0.3em] text-yt-red font-bold mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> FORMATS
                </p>
                <h2 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight leading-none mb-5">
                  Download Panel
                </h2>
              </motion.div>

              {/* Thumbnail + Meta */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex gap-4 items-start"
              >
                <div className="relative w-36 sm:w-48 aspect-video rounded-xl overflow-hidden shrink-0 border border-white/10">
                  <Image
                    src={data.thumbnail}
                    alt={data.title}
                    fill
                    className="object-cover"
                    sizes="192px"
                    priority
                  />
                  <div className="absolute bottom-1.5 right-1.5 bg-black/80 backdrop-blur-sm text-white text-[10px] font-mono px-2 py-0.5 rounded">
                    {data.duration}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-white/40 uppercase tracking-widest mb-1">
                    {data.channel}
                  </p>
                  <h3 className="text-base sm:text-lg font-display font-bold text-white leading-snug line-clamp-2">
                    {data.title}
                  </h3>
                </div>
              </motion.div>
            </div>

            {/* Right: Helper text */}
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:w-56 xl:w-64 shrink-0"
            >
              <div className="rounded-xl border border-white/6 bg-white/2 p-4">
                <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">
                  How it works
                </p>
                <p className="text-xs text-white/45 leading-relaxed">
                  Merged streams (up to 720p) include audio. For 1080p+, YouTube requires downloading 'Video Only' and 'Audio' separately.
                </p>
              </div>
            </motion.div>
          </div>

          {/* ═══════════════ ROW 2: Metrics Grid ═══════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="grid grid-cols-3 gap-4 mb-6"
          >
            {[
              { label: "DURATION", value: data.duration },
              { label: "FORMATS", value: String(data.formatCount) },
              { label: "CREATOR", value: data.channel },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="bg-white/3 border border-white/10 rounded-xl p-4"
              >
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-1">
                  {label}
                </p>
                <p className="text-sm sm:text-base font-bold text-white truncate">
                  {value}
                </p>
              </div>
            ))}
          </motion.div>

          {/* Divider */}
          <div className="h-px bg-white/6 mb-6" />

          {/* ═══════════════ ROW 3: Split Media Columns ═══════════════ */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* ── VIDEO Column ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-white/40" />
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">
                    Video
                  </span>
                </div>
                <span className="text-[10px] text-white/25 tabular-nums">
                  {data.videoFormats.length} options
                </span>
              </div>

              <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-3">
                <motion.div
                  variants={listVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col gap-2"
                >
                  {data.videoFormats.length > 0 ? (
                    data.videoFormats.map((fmt, index) => (
                      <FormatRow
                        key={fmt.format_id}
                        fmt={fmt}
                        videoId={data.videoId}
                        icon={Film}
                        hoverColor="hover:bg-yt-red"
                        index={index}
                        type="video"
                        onDownload={handleDownload}
                        progress={downloadProgress[fmt.format_id] || 0}
                        isDownloading={isDownloading[fmt.format_id] || false}
                      />
                    ))
                  ) : (
                    <p className="text-xs text-white/25 text-center py-8">
                      No video streams available. Try a different resolution.
                    </p>
                  )}
                </motion.div>
              </div>
            </div>

            {/* ── AUDIO Column ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-white/40" />
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">
                    Audio
                  </span>
                </div>
                <span className="text-[10px] text-white/25 tabular-nums">
                  {data.audioFormats.length} options
                </span>
              </div>

              <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-3">
                <motion.div
                  variants={listVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col gap-2"
                >
                  {data.audioFormats.length > 0 ? (
                    data.audioFormats.map((fmt, index) => (
                      <FormatRow
                        key={fmt.format_id}
                        fmt={fmt}
                        videoId={data.videoId}
                        icon={Music}
                        hoverColor="hover:bg-yt-red"
                        index={index}
                        type="audio"
                        onDownload={handleDownload}
                        progress={downloadProgress[fmt.format_id] || 0}
                        isDownloading={isDownloading[fmt.format_id] || false}
                      />
                    ))
                  ) : (
                    <p className="text-xs text-white/25 text-center py-8">
                      No audio streams available.
                    </p>
                  )}
                </motion.div>
              </div>
            </div>
          </div>

          {/* ═══════════════ Footer ═══════════════ */}
          <div className="mt-6 pt-5 border-t border-white/6 flex items-center justify-between">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onReset}
              className="flex items-center gap-2 text-sm text-white/35 hover:text-white transition-colors duration-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Download another
            </motion.button>
            <p className="text-[10px] text-white/20 select-none">
              Powered by KODEX
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
