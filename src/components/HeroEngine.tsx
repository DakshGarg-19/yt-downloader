"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Zap, Loader2, ArrowRight } from "lucide-react";
import ResultCard, { type ResultData } from "./ResultCard";

// Export for DynamicNav
export type AppStatus = "idle" | "processing" | "success" | "error";

interface HeroEngineProps {
  onStatusChange?: (status: AppStatus) => void;
}

export default function HeroEngine({ onStatusChange }: HeroEngineProps) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [resultData, setResultData] = useState<ResultData | null>(null);

  const handleCapture = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    setError(null);
    setStatus("loading");
    onStatusChange?.("processing");

    try {
      const res = await fetch("/api/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "An unknown error occurred.");
      }

      const data = await res.json();
      setResultData(data);
      setStatus("success");
      onStatusChange?.("success");
    } catch (err: any) {
      console.error("Capture Failed:", err);
      setError(err.message);
      setStatus("error");
      onStatusChange?.("error");
      // Optional: Reset to idle after a few seconds
      setTimeout(() => {
        setStatus("idle");
        onStatusChange?.("idle");
      }, 5000);
    }
  };

  const handleReset = useCallback(() => {
    setStatus("idle");
    setUrl("");
    setResultData(null);
    setError(null);
    onStatusChange?.("idle");
  }, [onStatusChange]);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background Glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yt-red/[0.04] rounded-full blur-[128px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-yt-red/[0.02] rounded-full blur-[100px]" />
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-white/[0.02] rounded-full blur-[80px]" />
      </div>

      {/* Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.1) 1px,transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Hero Title (idle or error only) */}
      <AnimatePresence mode="wait">
        {(status === "idle" || status === "error") && (
          <motion.div
            key="hero-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 relative z-10 px-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center gap-2 mb-6"
            >
              <Zap className="w-4 h-4 text-yt-red" />
              <span className="text-xs uppercase tracking-[0.3em] text-muted font-semibold">
                Powered by KODEX
              </span>
              <Zap className="w-4 h-4 text-yt-red" />
            </motion.div>

            <div className="relative">
              {["UNLEASH", "THE", "MEDIA"].map((word, i) => (
                <motion.h1
                  key={word}
                  initial={{ opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.3 + i * 0.15,
                    type: "spring",
                    damping: 20,
                  }}
                  className={`font-display font-extrabold text-5xl sm:text-7xl md:text-8xl lg:text-9xl leading-[0.85] tracking-tighter mt-1 ${
                    word === "THE" ? "text-gradient-red" : "text-white"
                  }`}
                >
                  {word}
                </motion.h1>
              ))}
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.03 }}
                transition={{ delay: 1 }}
                className="absolute -top-8 -left-8 font-display font-extrabold text-[12rem] sm:text-[16rem] md:text-[20rem] leading-none tracking-tighter text-white select-none pointer-events-none whitespace-nowrap"
                aria-hidden
              >
                YT
              </motion.span>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-8 text-base sm:text-lg text-muted max-w-lg mx-auto leading-relaxed"
            >
              Capture any YouTube video or audio in premium quality.
              <br className="hidden sm:block" />
              <span className="text-white/60">4K, 1080p, WAV, MP3</span> —
              instantly.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input / Loader / Result */}
      <div className="relative z-50 w-full max-w-5xl px-4">
        <AnimatePresence mode="wait">
          {/* IDLE / ERROR: Input */}
          {(status === "idle" || status === "error") && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="max-w-2xl mx-auto"
            >
              <div className="glass rounded-full p-2">
                <form
                  onSubmit={handleCapture}
                  className="flex items-center gap-2"
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/5">
                    <Search className="w-5 h-5 text-muted" />
                  </div>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Paste a YouTube URL..."
                    className="flex-1 bg-transparent text-white placeholder-white/30 text-base sm:text-lg outline-none font-sans px-2"
                    autoFocus
                  />
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={!url.trim()}
                    className="flex items-center gap-2 bg-yt-red hover:bg-yt-red-dark disabled:bg-white/10 disabled:text-white/30 text-white font-semibold px-6 py-3 rounded-full transition-colors duration-200 text-sm sm:text-base min-w-[120px] justify-center"
                  >
                    <span>Capture</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </form>
              </div>

              {/* OUTCOME ERROR MESSAGE: Right below the form! */}
              {status === "error" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 bg-red-900/50 border border-red-500 text-red-300 text-sm px-4 py-3 rounded-lg text-center"
                >
                  <p className="font-bold">Capture Failed</p>
                  <p>{error}</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* LOADING */}
          {status === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto"
            >
              <div className="glass rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center animate-pulse-glow">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "linear",
                  }}
                  className="mb-6"
                >
                  <Loader2 className="w-12 h-12 text-yt-red" />
                </motion.div>
                <p className="text-white font-display font-bold text-lg sm:text-xl mb-2">
                  Analyzing Media
                </p>
                <p className="text-muted text-sm truncate max-w-xs sm:max-w-md mb-6">
                  {url}
                </p>
                <div className="w-full max-w-xs h-1 bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-yt-red rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "85%" }}
                    transition={{ duration: 4, ease: "easeOut" }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* SUCCESS: Result Card */}
          {status === "success" && resultData && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ResultCard data={resultData} onReset={handleReset} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
