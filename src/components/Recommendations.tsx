"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";

interface TrendingVideo {
  id: number;
  title: string;
  channel: string;
  views: string;
  duration: string;
  type: string;
  image: string;
}

const mockTrendingData: TrendingVideo[] = [
  {
    id: 1,
    title: "Tokyo Neon Nights — A Cinematic 4K Journey",
    channel: "Wanderlust Films",
    views: "14.2M",
    duration: "12:44",
    type: "4K HDR",
    image:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "Building the World's Most Powerful AI Computer",
    channel: "Tech Insider",
    views: "8.9M",
    duration: "28:03",
    type: "Documentary",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "Epic Lo-fi Beats — 3 Hours of Pure Focus",
    channel: "ChillWave Studio",
    views: "22.1M",
    duration: "3:00:00",
    type: "Music",
    image:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 4,
    title: "Deep Ocean: Unseen Creatures of the Abyss",
    channel: "NatGeo Wild",
    views: "31.7M",
    duration: "44:20",
    type: "Nature",
    image:
      "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 5,
    title: "The Ultimate Guide to Web Design in 2025",
    channel: "DesignTheory",
    views: "5.3M",
    duration: "1:02:17",
    type: "Tutorial",
    image:
      "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?q=80&w=1200&auto=format&fit=crop",
  },
];

export default function Recommendations() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Using gsap.context for safe React cleanup
    const ctx = gsap.context(() => {
      gsap.to(sectionRef.current, {
        xPercent: -100,
        x: "100vw",
        ease: "none",
        scrollTrigger: {
          trigger: triggerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
          pin: true,
        },
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <div ref={triggerRef} className="bg-[#0a0a0a] overflow-hidden">
      <div
        ref={sectionRef}
        className="flex h-screen w-[300vw] items-center px-20 gap-10"
      >
        {mockTrendingData.map((video) => (
          <div
            key={video.id}
            className="group relative min-w-[40vw] h-[60vh] rounded-3xl overflow-hidden border border-white/10 flex-shrink-0 cursor-pointer"
          >
            {/* Background Image with hover zoom */}
            <div className="absolute inset-0">
              <Image
                src={video.image}
                alt={video.title}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                sizes="40vw"
              />
            </div>

            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />

            {/* Top-left: Duration badge */}
            <div className="absolute top-5 left-5 z-10">
              <span className="bg-black/60 backdrop-blur-md text-white/90 text-xs font-mono px-3 py-1.5 rounded-full border border-white/10">
                {video.duration}
              </span>
            </div>

            {/* Top-right: Type badge */}
            <div className="absolute top-5 right-5 z-10">
              <span className="bg-white/10 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/15 uppercase tracking-wider">
                {video.type}
              </span>
            </div>

            {/* Bottom: Content */}
            <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
              <span className="text-yt-red font-mono italic text-sm mb-2 block">
                0{video.id}
              </span>
              <h3 className="text-2xl sm:text-3xl font-display font-black text-white leading-tight mb-3 line-clamp-2 group-hover:text-yt-red transition-colors duration-300">
                {video.title}
              </h3>
              <div className="flex items-center gap-4 text-sm text-white/50">
                <span>{video.channel}</span>
                <span className="w-1 h-1 rounded-full bg-white/30" />
                <span>{video.views} views</span>
              </div>
            </div>

            {/* Subtle glow on hover */}
            <div className="absolute inset-0 rounded-3xl ring-1 ring-yt-red/0 group-hover:ring-yt-red/30 transition-all duration-300" />
          </div>
        ))}
      </div>
    </div>
  );
}