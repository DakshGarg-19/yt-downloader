import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

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
    
    // Get the direct stream URL using global command
    const { stdout } = await execPromise(`yt-dlp --cookies cookies.txt -f ${format_id} --get-url "${url}"`);
    const directUrl = stdout.trim();

    return NextResponse.redirect(directUrl, 302);
  } catch (error: any) {
    console.error('DOWNLOAD ERROR:', error.message);
    return new NextResponse('Download failed', { status: 500 });
  }
}
