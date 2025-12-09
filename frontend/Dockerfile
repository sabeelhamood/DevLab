# ---------- Build Stage ----------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ---------- Production Stage (Node) ----------
FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app /app

EXPOSE 80

CMD ["npm", "start"]

