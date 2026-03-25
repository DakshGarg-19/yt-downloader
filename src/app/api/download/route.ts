import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

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
    
    // Use the global path where pip3 installs it on Render/Linux
    const bin = process.env.NODE_ENV === 'production' 
      ? '/usr/local/bin/yt-dlp' 
      : path.join(process.cwd(), process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');

    const cookies = path.join(process.cwd(), 'cookies.txt');
    const cookieArg = fs.existsSync(cookies) ? `--cookies "${cookies}"` : '';

    // Get the direct stream URL using the detected binary
    const { stdout } = await execPromise(`"${bin}" ${cookieArg} -f "${format_id}" --get-url "${url}"`);
    const directUrl = stdout.trim();

    return NextResponse.redirect(directUrl, 302);
  } catch (error: any) {
    console.error('DOWNLOAD ERROR:', error.message);
    return new NextResponse('Download failed', { status: 500 });
  }
}
