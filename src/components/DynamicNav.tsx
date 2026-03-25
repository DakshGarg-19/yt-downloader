"use client";

import { useState, useEffect } from "react";

type AppStatus = "idle" | "processing" | "success" | "error";

interface DynamicNavProps {
  status: AppStatus;
}

function getStatusLabel(status: AppStatus): string {
  switch (status) {
    case "processing":
      return "EXTRACTING...";
    case "success":
      return "READY";
    case "error":
      return "RETRY";
    default:
      return "ONLINE";
  }
}

function getStatusColor(status: AppStatus): string {
  switch (status) {
    case "processing":
      return "text-yellow-400";
    case "success":
      return "text-emerald-400";
    case "error":
      return "text-yt-red";
    default:
      return "text-white";
  }
}

function formatSpeed(mbps: number): string {
  if (mbps >= 1000) return `${(mbps / 1000).toFixed(1)}GB/s`;
  return `${Math.round(mbps)}MB/s`;
}

export default function DynamicNav({ status }: DynamicNavProps) {
  const [speed, setSpeed] = useState(1200); // Start at 1.2GB/s (1200 MB/s)
  const [tick, setTick] = useState(false); // for blink effect on processing

  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly fluctuate between 850 MB/s and 1200 MB/s
      const newSpeed = Math.round(850 + Math.random() * 350);
      setSpeed(newSpeed);
      setTick((t) => !t);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const statusLabel = getStatusLabel(status);
  const statusColor = getStatusColor(status);
  const isProcessing = status === "processing";

  return (
    <nav className="fixed top-0 w-full z-50 flex justify-between items-center p-8 mix-blend-difference pointer-events-none">
      <div className="font-display font-black text-2xl tracking-tighter text-white pointer-events-auto">
        KODEX.
      </div>
      <div className="hidden md:flex gap-8 text-[10px] font-bold tracking-[0.3em] uppercase opacity-60 text-white">
        <span>Speed: {formatSpeed(speed)}</span>
        <span className={`transition-colors duration-300 ${statusColor} ${isProcessing && tick ? "opacity-40" : "opacity-100"}`}>
          Status: {statusLabel}
        </span>
      </div>
    </nav>
  );
}
