"use client";

import Image from "next/image";
import { Play, Clock } from "lucide-react";
import { VideoResource } from "@/data/marketplace/types";

interface VideoCardProps {
  video: VideoResource;
  onWatch?: (video: VideoResource) => void;
}

export function VideoCard({ video, onWatch }: VideoCardProps) {
  return (
    <div className="group flex flex-col justify-between bg-white border border-zinc-200 rounded-xl overflow-hidden hover:border-[#00A651]/50 hover:shadow-lg transition-all duration-300">
      {/* 1. VISUAL 16:9 VIDEO PREVIEW */}
      <div
        onClick={() => onWatch?.(video)}
        className="relative w-full aspect-video bg-zinc-950 overflow-hidden cursor-pointer"
      >
        <Image
          src={video.thumbnail}
          alt={video.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500 brightness-95 group-hover:brightness-100"
        />

        {/* Ambient Dark Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/20 to-zinc-950/40" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
          {video.videoType && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-white bg-zinc-900/80 backdrop-blur-md px-2.5 py-1 rounded border border-white/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00A651]" />
              {video.videoType}
            </span>
          )}

          {video.date && (
            <span className="text-[10px] font-medium text-zinc-300 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded">
              {video.date}
            </span>
          )}
        </div>

        {/* Centered Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/90 text-zinc-900 group-hover:bg-[#00A651] group-hover:text-white flex items-center justify-center shadow-xl group-hover:scale-110 active:scale-95 transition-all duration-200">
            <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current translate-x-0.5" />
          </div>
        </div>

        {/* Bottom Duration Badge */}
        {video.duration && (
          <div className="absolute bottom-3 right-3 z-10">
            <span className="inline-flex items-center gap-1 bg-black/80 backdrop-blur-md text-white font-mono text-[11px] font-bold px-2 py-0.5 rounded border border-white/10">
              <Clock className="w-3 h-3 text-[#00A651]" />
              {video.duration}
            </span>
          </div>
        )}
      </div>

      {/* 2. VIDEO INFO & PRIMARY ACTION */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
        <div>
          <h3
            onClick={() => onWatch?.(video)}
            className="text-sm sm:text-base font-bold text-zinc-900 leading-snug line-clamp-2 group-hover:text-[#00A651] transition-colors mb-2 cursor-pointer"
          >
            {video.title}
          </h3>

          <p className="text-xs text-zinc-600 leading-relaxed line-clamp-2">
            {video.description}
          </p>
        </div>

        <div className="mt-5 pt-4 border-t border-zinc-100">
          <button
            type="button"
            onClick={() => onWatch?.(video)}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-white bg-zinc-900 hover:bg-[#00A651] active:scale-[0.99] transition-all duration-150 shadow-xs"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Watch Video →</span>
          </button>
        </div>
      </div>
    </div>
  );
}
