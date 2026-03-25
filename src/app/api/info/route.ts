import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

export const runtime = 'nodejs';
const execPromise = promisify(exec);

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    // Use global command for Docker/Railway
    const bin = 'yt-dlp'; 
    const cookieArg = ''; // Optional: add `--cookies cookies.txt` if needed

    const { stdout } = await execPromise(`"${bin}" ${cookieArg} -j --no-warnings "${url}"`);
    const info = JSON.parse(stdout.split('\n')[0]);

    // STRICT FILTER: Only allow direct HTTPS files. No DASH manifests. No chunked streams.
    const validFormats = info.formats.filter((f: any) => f.protocol === 'https');

    const videoFormats = validFormats
      .filter((f: any) => f.vcodec !== 'none')
      .map((f: any) => {
        const isMerged = f.acodec !== 'none';
        return {
          format_id: f.format_id,
          quality: f.resolution || `${f.height}p`,
          mimeType: f.ext || 'mp4',
          size: f.filesize ? (f.filesize / 1024 / 1024).toFixed(1) + ' MB' : (f.filesize_approx ? (f.filesize_approx / 1024 / 1024).toFixed(1) + ' MB' : 'Unknown'),
          isMerged,
          badge: isMerged ? 'MERGED (Video+Audio)' : 'VIDEO ONLY',
          sortPriority: isMerged ? 1 : 2
        };
      })
      .sort((a: any, b: any) => a.sortPriority - b.sortPriority || parseInt(b.quality) - parseInt(a.quality));

    const audioFormats = validFormats
      .filter((f: any) => f.vcodec === 'none' && f.acodec !== 'none')
      .sort((a: any, b: any) => (b.abr || 0) - (a.abr || 0))
      .map((f: any) => ({
        format_id: f.format_id,
        quality: f.abr ? `${Math.round(f.abr)} kbps` : 'Audio',
        mimeType: f.ext || 'webm',
        size: f.filesize ? (f.filesize / 1024 / 1024).toFixed(1) + ' MB' : (f.filesize_approx ? (f.filesize_approx / 1024 / 1024).toFixed(1) + ' MB' : 'Unknown'),
        isMerged: false,
        badge: 'AUDIO ONLY'
      }));

    return NextResponse.json({
      videoId: info.id,
      title: info.title,
      thumbnail: info.thumbnail,
      channel: info.uploader,
      duration: new Date(info.duration * 1000).toISOString().substring(11, 19),
      formatCount: videoFormats.length + audioFormats.length,
      videoFormats,
      audioFormats
    });
  } catch (error: any) {
    console.error('INFO ERROR:', error.message);
    return NextResponse.json({ error: 'Failed to process video.' }, { status: 500 });
  }
}