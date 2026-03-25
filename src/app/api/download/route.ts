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

  if (!videoId || !format_id) {
    return new NextResponse('Missing videoId or format_id', { status: 400 });
  }

  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
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

      // CRITICAL FIX: Added --quiet and --no-warnings so ONLY the clean URL is returned
      const { stdout } = await execPromise(
        `"${bin}" ${cookieArg} --user-agent "${userAgent}" --js-runtimes node --no-playlist --quiet --no-warnings -f "${format_id}" --get-url "${url}"`, 
        { maxBuffer: 50 * 1024 * 1024 }
      );
      
      // Safety net: split by newline and grab the last line in case stray text sneaks in
      const lines = stdout.trim().split('\n');
      const directUrl = lines[lines.length - 1].trim();

      const response = await fetch(directUrl);
      
      if (!response.ok) {
        throw new Error(`YouTube source returned ${response.status}: ${response.statusText}`);
      }

      const headers = new Headers();
      headers.set('Content-Type', response.headers.get('Content-Type') || 'video/mp4');
      
      // CRITICAL FIX: Tell the browser exactly how large the file is so it doesn't get "stuck"
      const contentLength = response.headers.get('Content-Length');
      if (contentLength) {
        headers.set('Content-Length', contentLength);
      }
      
      headers.set('Content-Disposition', `attachment; filename="KODEX_${videoId}.mp4"`);

      return new NextResponse(response.body, {
        status: 200,
        headers
      });
    } finally {
      if (fs.existsSync(cookiePath)) {
        try { fs.unlinkSync(cookiePath); } catch (e) {}
      }
    }
  } catch (error: any) {
    console.error('DOWNLOAD ERROR:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}