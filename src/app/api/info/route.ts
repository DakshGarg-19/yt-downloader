import { NextResponse } from 'next/server';
import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

export const runtime = 'nodejs';
const execPromise = promisify(exec);

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    
    // Try to find yt-dlp.exe (Windows) or yt-dlp (Linux/Mac)
    let bin = process.env.NODE_ENV === 'production' 
      ? '/usr/local/bin/yt-dlp' 
      : path.join(process.cwd(), process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');

    // Diagnostic check
    if (!fs.existsSync(bin)) {
      console.warn('DIAGNOSTIC: Local binary not found at:', bin);
      try {
        // Try finding it in the system path as a fallback
        const cmd = process.platform === 'win32' ? 'where yt-dlp' : 'which yt-dlp';
        bin = execSync(cmd).toString().trim().split('\n')[0];
      } catch (e: any) {
        bin = 'yt-dlp'; // Last resort: global path
      }
    }
    
    const cookies = path.join(process.cwd(), 'cookies.txt');

    // --dump-json guarantees clean output
    const { stdout } = await execPromise(`"${bin}" -j "${url}"`);
    
    // Fix: Find the first '{' and last '}' to strip warnings
    const jsonString = stdout.slice(stdout.indexOf('{'), stdout.lastIndexOf('}') + 1);
    const info = JSON.parse(jsonString);

    // Sort and tag the formats
    const videoFormats = info.formats
      .filter((f: any) => f.vcodec !== 'none')
      .map((f: any) => {
        const isMerged = f.acodec !== 'none';
        return {
          format_id: f.format_id,
          quality: f.resolution || `${f.height}p`,
          mimeType: f.ext || 'mp4',
          size: f.filesize ? (f.filesize / 1024 / 1024).toFixed(1) + ' MB' : 'N/A',
          isMerged,
          isBest: false
        };
      })
      .sort((a: any, b: any) => parseInt(b.quality) - parseInt(a.quality)); // Sort High to Low

    const audioFormats = info.formats
      .filter((f: any) => f.vcodec === 'none' && f.acodec !== 'none')
      .sort((a: any, b: any) => (b.abr || 0) - (a.abr || 0)) // Highest bitrate first
      .map((f: any) => ({
        format_id: f.format_id,
        quality: f.abr ? `${Math.round(f.abr)} kbps` : 'Audio',
        mimeType: f.ext || 'webm',
        size: f.filesize ? (f.filesize / 1024 / 1024).toFixed(1) + ' MB' : 'N/A',
        isBest: false
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
  } catch (error: any) {
    console.error('PARSE ERROR:', error.message);
    return NextResponse.json({ error: 'Failed to process video. Check binary path.' }, { status: 500 });
  }
}
