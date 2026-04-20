FROM node:20-bullseye-slim

WORKDIR /app

# Install native build dependencies for packages like canvas
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install --legacy-peer-deps

# BUILD_TIMESTAMP: 2026-04-20T12:24:30Z
# This line is updated by deploy-to-dokploy.sh on every deploy.
# Changing it forces Docker to invalidate the COPY cache below,
# guaranteeing the fresh dist/public/ bundle is always copied in.
COPY . .

# dist/public/ is pre-built in Replit and committed to git.
# Only build the server-side bundle here — no vite in Docker.
RUN npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
