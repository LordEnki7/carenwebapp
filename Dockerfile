FROM node:20-bullseye-slim

WORKDIR /app

# Install native build dependencies for packages like canvas
RUN apt-get update && apt-get install -y \
    git \
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

COPY . .

# .dockerignore allows .git/HEAD + .git/refs + .git/packed-refs into the build context
# (the full 3GB .git history is still excluded). This gives git enough to run
# "git rev-parse HEAD", so write-build-info.cjs can stamp the real commit hash into
# build-info.json without any hardcoded value in this file.
RUN node scripts/write-build-info.cjs

# Build args for VITE_* env vars — pass these from Dokploy's Build Arguments panel.
# Without them Vite still compiles, it just falls back to its runtime defaults.
ARG VITE_STRIPE_PUBLIC_KEY
ARG VITE_REVENUECAT_IOS_API_KEY
ARG VITE_PRODUCTION_API_URL=https://carenalert.com

ENV VITE_STRIPE_PUBLIC_KEY=$VITE_STRIPE_PUBLIC_KEY
ENV VITE_REVENUECAT_IOS_API_KEY=$VITE_REVENUECAT_IOS_API_KEY
ENV VITE_PRODUCTION_API_URL=$VITE_PRODUCTION_API_URL

# Build the frontend inside Docker — no more committing dist/public/ to git.
RUN npx vite build

# Build the server-side bundle.
RUN npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
