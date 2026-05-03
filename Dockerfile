# ---- React build ----
FROM node:16.20.0 AS react
WORKDIR /app
COPY ./FrontEnd .

RUN yarn config set registry https://registry.npmjs.org \
 && yarn config set network-timeout 600000 \
 && yarn config set prefer-offline true \
 && yarn config set progress false

RUN yarn install --ignore-engines

RUN node -e "try{require.resolve('node-sass');process.exit(0)}catch(e){process.exit(1)}" \
 || echo 'node-sass not in deps, skipping rebuild'

RUN npm rebuild node-sass || true
RUN sed -i 's/NODE_OPTIONS=--openssl-legacy-provider[[:space:]]*//g' package.json
RUN npm run build


# ---- OHIF build ----
FROM node:16.20.0 AS ohif
WORKDIR /ohif/Viewers
COPY ./ohif/Viewers .

RUN yarn config set registry https://registry.npmjs.org \
 && yarn config set network-timeout 600000 \
 && yarn config set prefer-offline true \
 && yarn config set progress false

RUN yarn install --network-timeout 600000

ENV NODE_OPTIONS=--max-old-space-size=3072
RUN QUICK_BUILD=true PUBLIC_URL=/viewer-ohif/ yarn run build


# ---- Stone assets ----
FROM alpine:3.20 AS stone
RUN apk --no-cache add unzip

WORKDIR /tmp
COPY ["stone/wasm-binaries.zip", "."]

RUN mkdir -p /stone \
 && unzip wasm-binaries.zip -d /stone


# ---- Final image ----
FROM node:18.17 AS final
WORKDIR /OrthancToolsJs
RUN mkdir -p build

RUN yarn config set registry https://registry.npmjs.org \
 && yarn config set network-timeout 600000 \
 && yarn config set prefer-offline true \
 && yarn config set progress false

COPY ./BackEnd/package.json ./BackEnd/yarn.lock* ./
RUN yarn install --production --non-interactive

COPY ./BackEnd .

COPY --from=react /app/build ./build/
COPY --from=ohif /ohif/Viewers/platform/viewer/dist ./build/viewer-ohif/
COPY --from=stone /stone/wasm-binaries/StoneWebViewer ./build/viewer-stone/
COPY --from=react /app/build/viewer-ohif/app-config.js ./build/viewer-ohif/
#COPY --from=react /app/build/viewer-stone/configuration.json ./build/viewer-stone/

EXPOSE 4000

ENV OrthancAddress=http://localhost
ENV OrthancPort=8042
ENV OrthancUsername=orthanc
ENV OrthancPassword=orthanc

CMD ["yarn", "start"]
