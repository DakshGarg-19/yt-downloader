import { NextResponse } from 'next/server';
import { exec, execSync } from 'child_process';
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
    // Try to find yt-dlp.exe (Windows) or yt-dlp (Linux/Mac)
    let bin = process.env.NODE_ENV === 'production' 
      ? '/usr/local/bin/yt-dlp' 
      : path.join(process.cwd(), process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');

    // Diagnostic check
    if (!fs.existsSync(bin)) {
      console.warn('DIAGNOSTIC: Local download binary not found at:', bin);
      try {
        // Try finding it in the system path as a fallback
        const cmd = process.platform === 'win32' ? 'where yt-dlp' : 'which yt-dlp';
        bin = execSync(cmd).toString().trim().split('\n')[0];
      } catch (e: any) {
        bin = 'yt-dlp'; // Last resort: global path
      }
    }
    
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    // Get the direct stream URL
    const { stdout: streamUrl } = await execPromise(`"${bin}" -f "${format_id}" -g "${url}"`);
    const cleanStreamUrl = streamUrl.trim();

    // Fetch the stream and pipe it to the client
    const response = await fetch(cleanStreamUrl);
    const blob = await response.blob();

    return new NextResponse(blob, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
        'Content-Length': response.headers.get('Content-Length') || '',
        'Content-Disposition': `attachment; filename="video_${videoId}.mp4"`,
      },
    });
  } catch (error: any) {
    console.error('DOWNLOAD ERROR:', error.message);
    return new NextResponse('Download failed', { status: 500 });
  }
}
