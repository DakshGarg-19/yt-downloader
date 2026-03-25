import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import os from 'os';

export const runtime = 'nodejs';
const execPromise = promisify(exec);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('videoId');
  const format_id = searchParams.get('format_id');
  const isAudio = searchParams.get('type') === 'audio';

  if (!videoId || !format_id) {
    return new NextResponse('Missing info', { status: 400 });
  }

  const cookiePath = path.join(os.tmpdir(), `yt-dl-${Date.now()}.txt`);
  
  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const bin = process.env.NODE_ENV === 'production' ? '/usr/local/bin/yt-dlp' : 'yt-dlp';
    
    // The master key. This must be exactly the same in BOTH the yt-dlp command AND the fetch request.
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    if (process.env.YOUTUBE_COOKIES) {
      fs.writeFileSync(cookiePath, process.env.YOUTUBE_COOKIES);
    }

    const cookieArg = fs.existsSync(cookiePath) ? `--cookies "${cookiePath}"` : '';

    // Extract the raw URL using --print urls (safer than --get-url)
    const { stdout } = await execPromise(
      `"${bin}" ${cookieArg} --user-agent "${userAgent}" --js-runtimes node --no-playlist --quiet --no-warnings --print urls -f "${format_id}" "${url}"`,
      { maxBuffer: 100 * 1024 * 1024 }
    );

    const directUrl = stdout.trim().split('\n').pop();
    
    if (!directUrl || !directUrl.startsWith('http')) {
        throw new Error('Failed to extract valid URL from YouTube');
    }

    // 🚨 THE CRITICAL FIX: We MUST pass the Chrome User-Agent to the fetch request, or YouTube blocks the stream. 🚨
    const res = await fetch(directUrl, {
        headers: {
            'User-Agent': userAgent
        }
    });

    if (!res.ok) {
        throw new Error(`YouTube blocked the download stream: ${res.status}`);
    }

    const ext = isAudio ? 'mp3' : 'mp4';
    const headers = new Headers(res.headers);
    headers.set('Content-Disposition', `attachment; filename="KODEX_${videoId}.${ext}"`);
    headers.set('Content-Type', 'application/octet-stream');

    return new NextResponse(res.body, { headers });
    
  } catch (e: any) {
    console.error('Download Pipe Error:', e);
    return new NextResponse(`Download Error: ${e.message}`, { status: 500 });
  } finally {
    if (fs.existsSync(cookiePath)) {
      try { fs.unlinkSync(cookiePath); } catch (e) {}
    }
  }
}