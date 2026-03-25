import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('videoId');
  const format_id = searchParams.get('format_id');

  if (!videoId || !format_id) return new NextResponse('Missing ID', { status: 400 });

  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const bin = 'yt-dlp';
    
    // Spawn yt-dlp and tell it to output to stdout ('-o', '-')
    const ytProcess = spawn(bin, ['--no-warnings', '-f', format_id, '-o', '-', url]);

    // Create a web ReadableStream to pipe the data to the browser
    const stream = new ReadableStream({
      start(controller) {
        ytProcess.stdout.on('data', (chunk) => {
          controller.enqueue(new Uint8Array(chunk));
        });
        ytProcess.stdout.on('end', () => {
          controller.close();
        });
        ytProcess.on('error', (err) => {
          controller.error(err);
        });
      },
      cancel() {
        ytProcess.kill();
      }
    });

    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        // Force the browser to download the file natively
        'Content-Disposition': `attachment; filename="KODEX_${videoId}_${format_id}.mp4"`,
      }
    });
  } catch (error: any) {
    console.error('DOWNLOAD STREAM ERROR:', error.message);
    return new NextResponse('Download failed', { status: 500 });
  }
}