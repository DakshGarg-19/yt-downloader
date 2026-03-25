import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import os from 'os';

export const runtime = 'nodejs';
const execPromise = promisify(exec);

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    const bin = process.env.NODE_ENV === 'production' ? '/usr/local/bin/yt-dlp' : 'yt-dlp';
    const cookiePath = path.join(os.tmpdir(), `youtube-cookies-${Date.now()}.txt`);

    try {
      if (process.env.YOUTUBE_COOKIES) {
        fs.writeFileSync(cookiePath, process.env.YOUTUBE_COOKIES);
      } else if (fs.existsSync(path.join(process.cwd(), 'cookies.txt'))) {
        fs.copyFileSync(path.join(process.cwd(), 'cookies.txt'), cookiePath);
      }

      const cookieArg = fs.existsSync(cookiePath) ? `--cookies "${cookiePath}"` : '';
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

      // CRITICAL FIX: --js-runtimes node
      const { stdout } = await execPromise(
        `"${bin}" ${cookieArg} --user-agent "${userAgent}" --no-playlist --js-runtimes node --no-warnings --quiet -j "${url}"`, 
        { 
          maxBuffer: 100 * 1024 * 1024,
          timeout: 25000 // Under 30s to prevent Railway 503 HTML injection
        }
      );
      
      const jsonString = stdout.slice(stdout.indexOf('{'), stdout.lastIndexOf('}') + 1);
      const info = JSON.parse(jsonString);

      const videoFormats = info.formats
        .filter((f: any) => f.vcodec !== 'none')
        .map((f: any) => ({
          format_id: f.format_id,
          quality: f.resolution || `${f.height}p`,
          mimeType: f.ext || 'mp4',
          size: f.filesize ? (f.filesize / 1024 / 1024).toFixed(1) + ' MB' : 'N/A',
          isMerged: f.acodec !== 'none'
        })).reverse();

      const audioFormats = info.formats
        .filter((f: any) => f.vcodec === 'none' && f.acodec !== 'none')
        .sort((a: any, b: any) => (b.abr || 0) - (a.abr || 0))
        .map((f: any) => ({
          format_id: f.format_id,
          quality: f.abr ? `${Math.round(f.abr)} kbps` : 'Audio',
          mimeType: f.ext || 'webm',
          size: f.filesize ? (f.filesize / 1024 / 1024).toFixed(1) + ' MB' : 'N/A',
        }));

      return NextResponse.json({
        originalUrl: url,
        videoId: info.id,
        title: info.title,
        thumbnail: info.thumbnail,
        channel: info.uploader,
        formatCount: info.formats.length,
        duration: new Date(info.duration * 1000).toISOString().substring(11, 19),
        videoFormats,
        audioFormats
      });
    } finally {
      if (fs.existsSync(cookiePath)) {
        try { fs.unlinkSync(cookiePath); } catch (e) {}
      }
    }
  } catch (error: any) {
    console.error('PARSE ERROR DETAILS:', error);
    return NextResponse.json({ error: "Server timeout or video blocked. Please try again." }, { status: 500 });
  }
}