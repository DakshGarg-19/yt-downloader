import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

export const runtime = 'nodejs';
const execPromise = promisify(exec);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('videoId');
  const format_id = searchParams.get('format_id');
  const type = searchParams.get('type'); // 'video' or 'audio'

  if (!videoId || !format_id) {
    return new NextResponse('Missing videoId or format_id', { status: 400 });
  }

  const cookiePath = path.join(os.tmpdir(), `yt-cookies-${Date.now()}.txt`);

  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const bin = process.env.NODE_ENV === 'production' ? '/usr/local/bin/yt-dlp' : 'yt-dlp';
    
    // The master key. MUST match in yt-dlp AND fetch.
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    if (process.env.YOUTUBE_COOKIES) {
      fs.writeFileSync(cookiePath, process.env.YOUTUBE_COOKIES);
    } else if (fs.existsSync(path.join(process.cwd(), 'cookies.txt'))) {
      fs.copyFileSync(path.join(process.cwd(), 'cookies.txt'), cookiePath);
    }

    const cookieArg = fs.existsSync(cookiePath) ? `--cookies "${cookiePath}"` : '';

    // 1. EXTRACT URL: --print urls and --quiet guarantee NO text pollution.
    const cmd = `"${bin}" ${cookieArg} --js-runtimes node --user-agent "${userAgent}" --no-playlist --quiet --no-warnings --print urls -f "${format_id}" "${url}"`;
    const { stdout } = await execPromise(cmd, { maxBuffer: 10 * 1024 * 1024 });
    
    const directUrl = stdout.trim().split('\n').pop();

    if (!directUrl || !directUrl.startsWith('http')) {
      throw new Error('Failed to extract valid secure URL');
    }

    // 2. FETCH STREAM: Pass the Chrome User-Agent so YouTube doesn't send a corrupt 0kb file
    const response = await fetch(directUrl, {
      headers: {
        'User-Agent': userAgent
      }
    });

    if (!response.ok) {
      throw new Error(`YouTube source returned ${response.status}: ${response.statusText}`);
    }

    // Set correct file extension
    const ext = type === 'audio' ? 'webm' : 'mp4';

    // 3. PIPE TO BROWSER
    return new NextResponse(response.body, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
        'Content-Length': response.headers.get('Content-Length') || '',
        'Content-Disposition': `attachment; filename="KODEX_${videoId}.${ext}"`,
      }
    });

  } catch (error: any) {
    console.error('DOWNLOAD ERROR:', error);
    return new NextResponse(error.message, { status: 500 });
  } finally {
    if (fs.existsSync(cookiePath)) {
      try { fs.unlinkSync(cookiePath); } catch (e) {}
    }
  }
}