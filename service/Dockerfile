# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for TypeScript compiler)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install required system dependencies
RUN apk add --no-cache git

# Create app directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Install Gemini CLI globally
RUN npm install -g @google/gemini-cli

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/config.yaml.example ./config.yaml

# Create necessary directories with proper permissions
RUN mkdir -p /app/logs /app/repositories /app/repository_locks && \
    chown -R appuser:nodejs /app

# Set user
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (res) => { \
    if (res.statusCode === 200) { \
      console.log('Health check passed'); \
      process.exit(0); \
    } else { \
      console.log('Health check failed'); \
      process.exit(1); \
    } \
  }).on('error', () => { \
    console.log('Health check failed'); \
    process.exit(1); \
  })"

# Start the application
CMD ["npm", "start"] 