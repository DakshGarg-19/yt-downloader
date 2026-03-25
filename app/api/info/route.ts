import { NextResponse } from 'next/server';
import ytdl from '@distube/ytdl-core';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!ytdl.validateURL(url)) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    const info = await ytdl.getInfo(url);
    
    // Filter formats to show progressive streams (video + audio merged)
    // or high-quality video-only streams if it's more appropriate.
    // The user's request specifically uses hasVideo && hasAudio for simplicity on Vercel.
    const formats = info.formats.filter(f => f.hasVideo && f.hasAudio);
    
    const videoFormats = formats.map(f => ({
      itag: f.itag,
      quality: f.qualityLabel || `${f.height}p`,
      mimeType: f.mimeType?.split(';')[0] || 'video/mp4',
      size: f.contentLength ? (parseInt(f.contentLength) / 1024 / 1024).toFixed(1) + ' MB' : 'N/A'
    }));

    // Audio-only formats
    const audioFormats = info.formats
      .filter(f => !f.hasVideo && f.hasAudio)
      .map(f => ({
        itag: f.itag,
        quality: f.audioBitrate ? `${f.audioBitrate} kbps` : 'Audio',
        mimeType: f.mimeType?.split(';')[0] || 'audio/webm',
        size: f.contentLength ? (parseInt(f.contentLength) / 1024 / 1024).toFixed(1) + ' MB' : 'N/A'
      }));

    return NextResponse.json({
      videoId: info.videoDetails.videoId,
      title: info.videoDetails.title,
      thumbnail: info.videoDetails.thumbnails[0].url,
      channel: info.videoDetails.author.name,
      duration: info.videoDetails.lengthSeconds,
      videoFormats,
      audioFormats
    });
  } catch (e: any) {
    console.error('YTDL INFO ERROR:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
