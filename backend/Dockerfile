FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create production image
FROM node:18-alpine

# Install dumb-init for proper process handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./

# Set user
USER appuser

EXPOSE 5000

# Use dumb-init as entrypoint
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/index.js"]
