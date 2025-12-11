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

# ---- Builder stage ----
FROM base AS builder

# Copy installed dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build the app
RUN npm run build

# ---- Runner / Production stage ----
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production


# Create user for running app
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy source files and dependencies
COPY --from=builder /app/src ./src
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Switch to non-root user
USER nextjs

# Expose port (for local testing only)
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
