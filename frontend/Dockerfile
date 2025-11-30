# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app/frontend

COPY package.json package-lock.json ./

RUN npm install --force

COPY . ./

RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:stable-alpine

COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Copy custom Nginx configuration
# If you have a custom nginx.conf, place it in the frontend directory
# and uncomment the following line:
# COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
