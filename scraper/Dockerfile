FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY dist ./dist

# Create .env file from environment variables (optional, can be mounted)
# For development, mount .env file directly

# Run the scraper
CMD ["node", "dist/index.js"]
