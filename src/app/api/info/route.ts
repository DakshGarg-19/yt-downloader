import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

export const runtime = 'nodejs';
const execPromise = promisify(exec);

export async function POST(req: Request) {
  const cookiePath = path.join(os.tmpdir(), `yt-info-cookies-${Date.now()}.txt`);
  try {
    const { url } = await req.json();
    const bin = process.env.NODE_ENV === 'production' ? '/usr/local/bin/yt-dlp' : 'yt-dlp';
    
    let cookieArg = '';

    if (process.env.YOUTUBE_COOKIES) {
      fs.writeFileSync(cookiePath, process.env.YOUTUBE_COOKIES);
      cookieArg = `--cookies "${cookiePath}"`;
    } else if (fs.existsSync(path.join(process.cwd(), 'cookies.txt'))) {
      fs.copyFileSync(path.join(process.cwd(), 'cookies.txt'), cookiePath);
      cookieArg = `--cookies "${cookiePath}"`;
    }

    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    const { stdout } = await execPromise(
      `"${bin}" ${cookieArg} --no-playlist --flat-playlist --dump-single-json --no-warnings --quiet --js-runtimes node --user-agent "${userAgent}" "${url}"`,
      { timeout: 25000, maxBuffer: 10 * 1024 * 1024 }
    );
    
    const info = JSON.parse(stdout.trim().split('\n')[0]);

    // PROTOCOL FILTERING (Allow HLS/DASH for 1080p+ options)
    const validFormats = info.formats.filter((f: any) => 
      f.protocol === 'https' || 
      f.protocol === 'm3u8_native' || 
      (f.url && f.url.includes('googlevideo'))
    );

    const videoFormats = validFormats
      .filter((f: any) => f.vcodec !== 'none')
      .map((f: any) => {
        const isMerged = f.acodec !== 'none';
        const sizeApprox = f.filesize || f.filesize_approx;
        return {
          format_id: f.format_id,
          quality: f.resolution || `${f.height}p`,
          mimeType: f.ext || 'mp4',
          size: sizeApprox ? (sizeApprox / 1024 / 1024).toFixed(1) + ' MB' : 'Unknown',
          isMerged,
          badge: isMerged ? 'MERGED (Video+Audio)' : 'VIDEO ONLY',
          sortPriority: isMerged ? 1 : 2
        };
      })
      .sort((a: any, b: any) => a.sortPriority - b.sortPriority || parseInt(b.quality) - parseInt(a.quality));

    const audioFormats = validFormats
      .filter((f: any) => f.vcodec === 'none' && f.acodec !== 'none')
      .sort((a: any, b: any) => (b.abr || 0) - (a.abr || 0))
      .map((f: any) => {
        const sizeApprox = f.filesize || f.filesize_approx;
        return {
          format_id: f.format_id,
          quality: f.abr ? `${Math.round(f.abr)} kbps` : 'Audio',
          mimeType: f.ext || 'webm',
          size: sizeApprox ? (sizeApprox / 1024 / 1024).toFixed(1) + ' MB' : 'Unknown',
          isMerged: false,
          badge: 'AUDIO ONLY'
        };
      });

    return NextResponse.json({
      videoId: info.id,
      title: info.title,
      thumbnail: info.thumbnail,
      channel: info.uploader,
      duration: new Date(info.duration * 1000).toISOString().substring(11, 19),
      formatCount: videoFormats.length + audioFormats.length,
      videoFormats,
      audioFormats
    });
  } catch (error: any) {
    console.error('INFO ERROR:', error.message);
    return NextResponse.json({ error: "YouTube is responding slowly. Please try once more." }, { status: 503 });
  } finally {
    if (fs.existsSync(cookiePath)) {
      try { fs.unlinkSync(cookiePath); } catch (e) {}
    }
  }
}