FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build app
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/index.html ./index.html
COPY package*.json ./

# Install serve
RUN npm ci --production

# Expose port
EXPOSE 5173

# Start server
CMD ["npx", "serve", "-s", "dist", "-l", "5173"]

