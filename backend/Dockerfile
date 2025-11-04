# Base image
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Install system dependencies for native modules
RUN apk add --no-cache libc6-compat

# ---- Dependencies stage ----
FROM base AS deps

# Copy only package files
COPY package*.json ./

# Install dependencies (omit dev)
RUN npm install --omit=dev

# ---- Runner / Production stage ----
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=$PORT

# Create user for running app
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nodejs

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source files and package.json
COPY package.json ./
COPY server.js ./
COPY src ./src

# Switch to non-root user
USER nodejs

# Expose port (Railway will inject PORT env var at runtime)
# Note: EXPOSE is just documentation - Railway routes to whatever port the app listens on
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
