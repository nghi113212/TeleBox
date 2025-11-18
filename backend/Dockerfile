FROM node:20.17.0-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN npm run build

FROM node:20.17.0-slim

WORKDIR /app

COPY --from=builder /app ./

ENV NODE_ENV=production

EXPOSE 8386

CMD ["npm", "start"]