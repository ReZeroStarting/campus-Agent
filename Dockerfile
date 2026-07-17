FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --production=false

# Copy source code
COPY . .

# Build TypeScript (optional, tsx handles runtime)
# RUN npm run build

# Default port for HTTP API
EXPOSE 3456

# Start HTTP API server
CMD ["npx", "tsx", "src/api/server.ts"]
