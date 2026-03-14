## BUILD stage ##
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json .
RUN npm ci --production

## RUN stage ##
FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules

COPY . .

ENV NODE_ENV=production

EXPOSE 8386
CMD ["node", "src/index.js"]