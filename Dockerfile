# Use Node.js 18
FROM node:18-bullseye-slim

# Install Python and yt-dlp
RUN apt-get update && apt-get install -y python3 python3-pip curl
RUN pip3 install yt-dlp --break-system-packages

# Setup app
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Expose port and start
EXPOSE 3000
CMD ["npm", "start"]
