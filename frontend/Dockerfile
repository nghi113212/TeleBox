FROM node:20.17.0-slim AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci 

COPY . .

RUN npm run build

# Production stage với Nginx
FROM nginx:alpine

# Copy file build từ stage builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy file cấu hình nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Nginx sẽ tự động chạy ở foreground
CMD ["nginx", "-g", "daemon off;"]

