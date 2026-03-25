import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

export const runtime = 'nodejs';

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
    
    const cookiePath = path.join(os.tmpdir(), 'youtube-cookies.txt');
    if (process.env.YOUTUBE_COOKIES) {
      fs.writeFileSync(cookiePath, process.env.YOUTUBE_COOKIES);
    } else if (fs.existsSync(path.join(process.cwd(), 'cookies.txt'))) {
      fs.copyFileSync(path.join(process.cwd(), 'cookies.txt'), cookiePath);
    }
    const cookieArgs = fs.existsSync(cookiePath) ? ['--cookies', cookiePath] : [];

    // MAGICAL FIX: Stream directly to stdout (-o -) instead of getting the URL.
    // This starts the download instantly and prevents 403 Forbidden errors.
    const ytProcess = spawn(bin, [
      ...cookieArgs,
      '--no-playlist',
      '-f', format_id,
      '-o', '-', 
      url
    ]);

    const stream = new ReadableStream({
      start(controller) {
        ytProcess.stdout.on('data', (chunk) => controller.enqueue(chunk));
        ytProcess.stdout.on('end', () => controller.close());
        ytProcess.on('error', (err) => controller.error(err));
      },
      cancel() {
        ytProcess.kill();
      }
    });

    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="KODEX_${videoId}_${format_id}.mp4"`,
      }
    });
  } catch (error: any) {
    console.error('DOWNLOAD ERROR:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}