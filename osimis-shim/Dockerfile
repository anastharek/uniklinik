# OSIMIS Web Viewer shim (arm64/x86) — UNIKLINIK
# Pure-JS reimplementation of the OSIMIS viewer data API over Orthanc.
# (The libOsimisWebViewer.so is amd64-only and NOT used by this shim — it is
#  intentionally excluded from the image.)
FROM node:20-alpine

WORKDIR /app

# Install deps (only `express`) — cached unless package*.json change
COPY package.json package-lock.json ./
RUN npm install --production --no-audit --no-fund

# App code + static viewer assets
COPY server.js ./
COPY assets ./assets

# Orthanc URL is injected at runtime (defaults to the compose service name)
ENV ORTHANC_URL=http://orthanc:8042
ENV PORT=8492

EXPOSE 8492

CMD ["node", "server.js"]
