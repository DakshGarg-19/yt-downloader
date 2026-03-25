import { NextResponse } from 'next/server';
import ytdl from '@distube/ytdl-core';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('videoId');
  const itag = searchParams.get('itag');

  if (!videoId || !itag) {
    return new NextResponse('Missing videoId or itag', { status: 400 });
  }

  const url = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    const info = await ytdl.getInfo(url);
    const format = ytdl.chooseFormat(info.formats, { quality: itag });
    
    if (!format || !format.url) {
      return new NextResponse('Format not found or URL missing', { status: 404 });
    }
    
    // Redirect the browser to the direct Google CDN URL
    // The browser will handle the download directly, bypassing Vercel limits
    return NextResponse.redirect(format.url, 302);
  } catch (e: any) {
    console.error('YTDL DOWNLOAD ERROR:', e.message);
    return new NextResponse('Download failed: ' + e.message, { status: 500 });
  }
}
