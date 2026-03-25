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
  const type = searchParams.get('type') || 'video';

  if (!videoId || !format_id) {
    return new NextResponse('Missing videoId or format_id', { status: 400 });
  }

  // Secure runtime cookie path
  const cookiePath = path.join(os.tmpdir(), `youtube-cookies-${videoId}.txt`);

  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    
    // On Linux/Docker, yt-dlp is installed globally in the system path.
    const bin = process.env.NODE_ENV === 'production' ? '/usr/local/bin/yt-dlp' : 'yt-dlp';

    // Write the cookies from the environment variable to a temporary file in the Docker container
    if (process.env.YOUTUBE_COOKIES) {
      fs.writeFileSync(cookiePath, process.env.YOUTUBE_COOKIES);
    } else if (fs.existsSync(path.join(process.cwd(), 'cookies.txt'))) {
      // Fallback for local development
      fs.copyFileSync(path.join(process.cwd(), 'cookies.txt'), cookiePath);
    }

    const cookieArg = fs.existsSync(cookiePath) ? `--cookies "${cookiePath}"` : '';

    // Get the direct stream URL using the system binary
    const cmd = `"${bin}" ${cookieArg} --js-runtimes node --no-playlist --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36" -f "${format_id}" --get-url "${url}"`;
    const { stdout } = await execPromise(cmd, { maxBuffer: 50 * 1024 * 1024 });
    const directUrl = stdout.trim();

    // Proxy the download through the server to bypass IP-locking
    const response = await fetch(directUrl);
    
    if (!response.ok) {
      throw new Error(`YouTube source returned ${response.status}: ${response.statusText}`);
    }

    const ext = type === 'audio' ? 'webm' : 'mp4';

    // Pass the stream directly to the client with forced download headers
    return new NextResponse(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': response.headers.get('Content-Length') || '',
        'Content-Disposition': `attachment; filename="KODEX-file.${ext}"`,
      }
    });
  } catch (error: any) {
    console.error('DOWNLOAD ERROR:', error);
    return new NextResponse(error.message, { status: 500 });
  } finally {
    // SECURE CLEANUP: Remove the temporary cookie file
    if (fs.existsSync(cookiePath)) {
      try {
        fs.unlinkSync(cookiePath);
      } catch (e) {
        console.error('Cleanup error:', e);
      }
    }
  }
}
