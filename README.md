# YT Downloader

A modern, fast, and reliable YouTube video downloader built with Next.js, React 19, and TailwindCSS. It utilizes `yt-dlp` under the hood with a robust "Bulletproof Native Stream Architecture" to stream and download high-quality videos and audio securely and efficiently.

## 🌟 Features

- **Bulletproof Native Stream Architecture**: Employs direct server-side streaming via `spawn` and native browser download management to prevent file corruption.
- **Bot Bypass & IP-Locking Workarounds**: Configured to bypass advanced bot detection mechanisms.
- **Beautiful UI/UX**: Crafted with Tailwind CSS, DaisyUI themes (Dark/Forest mode toggle), and smooth animations using Framer Motion and GSAP. 
- **High-Quality Downloads**: Uses `youtube-dl-exec` for reliable media extraction.
- **Format Filtering**: Strict HTTPS format filtering for reliable file delivery.

## 🚀 Tech Stack

- **Framework**: [Next.js](https://nextjs.org) (App Router)
- **Frontend library**: [React 19](https://react.dev)
- **Styling**: [Tailwind CSS](https://tailwindcss.com) + [DaisyUI](https://daisyui.com/) (with dynamic theme toggles)
- **Animations**: [Framer Motion](https://www.framer.com/motion/) & [GSAP](https://gsap.com/)
- **Icons**: [Lucide React](https://lucide.dev)
- **Downloader Core**: `youtube-dl-exec` (`yt-dlp`)

## 💻 Running Locally

### Prerequisites

Ensure you have the following installed on your machine:
- Node.js (v20.0.0 or later)
- Python 3 (required by `yt-dlp`)
- FFmpeg (for media processing & merging)

### Installation

1. **Clone the repository** (or download the source):
   ```bash
   git clone <repository-url>
   cd yt-downloader
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Access the application**: 
   Open [http://localhost:3000](http://localhost:3000) with your browser.

## 🐳 Docker Deployment (e.g., Railway)

This project includes a `Dockerfile` pre-configured to handle all the necessary system dependencies (like FFmpeg and Python) required by `yt-dlp`.

1. **Build the Docker Image**:
   ```bash
   docker build -t yt-downloader .
   ```

2. **Run the Docker Container**:
   ```bash
   docker run -p 3000:3000 yt-downloader
   ```

To deploy on [Railway.app](https://railway.app/), simply connect this repository and let Railway automatically build and deploy the Dockerfile.

## 📝 License

This project is intended for personal use and educational purposes. Ensure you comply with YouTube's Terms of Service and copyright laws when using this software.
