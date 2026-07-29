# ======================================================
#  Frontend Dockerfile — React + Vite (Development)
# ======================================================
FROM node:22-alpine

WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source
COPY . .

EXPOSE 5173

# Vite dev server accessible from host
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
