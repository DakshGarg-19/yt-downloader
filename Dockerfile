FROM node:20-bookworm-slim

# Install system dependencies + python3 + ffmpeg
# We add 'python3' because yt-dlp needs it, and it often needs a JS runtime 
# to solve YouTube signatures.
RUN apt-get update && apt-get install -y \
    curl \
    python3 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp binary
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy everything else
COPY . .

# Build
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
