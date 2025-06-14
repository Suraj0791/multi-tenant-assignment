# Build stage
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Add nginx user
RUN adduser -D -g 'www' www && \
    chown -R www:www /usr/share/nginx/html

# Switch to non-root user
USER www

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
