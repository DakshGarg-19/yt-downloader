FROM node:20-bookworm-slim

# Install vital system dependencies for yt-dlp signature solving
# ca-certificates: Needed for HTTPS/SSL verification
# python3 & python-is-python3: Required for yt-dlp to execute JS deciphering
RUN apt-get update && apt-get install -y \
    curl \
    python3 \
    python-is-python3 \
    ffmpeg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install the latest yt-dlp binary directly from GitHub
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app

# Optimize layer caching
COPY package*.json ./
RUN npm install

# Copy application code and build
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
