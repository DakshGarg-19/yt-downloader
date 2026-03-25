# Use Node.js 18
FROM node:18-bullseye-slim

# Install system dependencies
RUN apt-get update && apt-get install -y curl python3 ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Install yt-dlp binary directly to the system path (No Pip, No Break-System-Packages)
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy project files
COPY . .

# Build the app
RUN npm run build

# Expose port
EXPOSE 3000

# Start
CMD ["npm", "start"]
