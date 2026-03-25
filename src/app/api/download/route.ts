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
    
    // On Linux/Docker, yt-dlp is installed globally in the system path.
    const bin = process.env.NODE_ENV === 'production' ? '/usr/local/bin/yt-dlp' : 'yt-dlp';

    // Secure runtime cookie path
    const cookiePath = path.join(os.tmpdir(), 'youtube-cookies.txt');

    // Write the cookies from the environment variable to a temporary file in the Docker container
    if (process.env.YOUTUBE_COOKIES) {
      fs.writeFileSync(cookiePath, process.env.YOUTUBE_COOKIES);
    } else if (fs.existsSync(path.join(process.cwd(), 'cookies.txt'))) {
      // Fallback for local development
      fs.copyFileSync(path.join(process.cwd(), 'cookies.txt'), cookiePath);
    }

    const cookieArg = fs.existsSync(cookiePath) ? `--cookies "${cookiePath}"` : '';

    // Get the direct stream URL using the system binary
    const { stdout } = await execPromise(`"${bin}" ${cookieArg} --no-playlist -f "${format_id}" --get-url "${url}"`, { maxBuffer: 50 * 1024 * 1024 });
    const directUrl = stdout.trim();

    return NextResponse.redirect(directUrl, 302);
  } catch (error: any) {
    console.error('DOWNLOAD ERROR:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}
