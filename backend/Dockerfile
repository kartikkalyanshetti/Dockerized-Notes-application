
# Use lightweight Node.js base image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better build caching
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Create non-root user
RUN addgroup -S appgroup && \
    adduser -S appuser -G appgroup

# Copy application source
COPY --chown=appuser:appgroup server.js ./

# Switch to non-root user
USER appuser

# Backend listens on port 3000
EXPOSE 3000

# Container health check
HEALTHCHECK --interval=30s \
    --timeout=5s \
    --start-period=10s \
    --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Start application
CMD ["node", "server.js"]

