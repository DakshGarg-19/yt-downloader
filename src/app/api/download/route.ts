import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

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
    const bin = process.env.NODE_ENV === 'production' 
      ? '/usr/local/bin/yt-dlp' // Linux production path
      : path.join(process.cwd(), 'yt-dlp.exe'); // Local development path (Windows)
    
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
