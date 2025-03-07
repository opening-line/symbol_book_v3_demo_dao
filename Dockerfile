FROM node:20.14.0-alpine AS builder

WORKDIR /build

COPY . .

RUN mkdir -p /app\
 && cd /build/client\
 && sed -iE 's/API_HOST: "http:\/\/localhost:3000",/API_HOST: window.location.origin,/g' src/utils/config.ts\
 && npm i\
 && npm run build\
 && mv dist /app/static\
 && cd /build/server\
 && npm i\
 && npm i esbuild\
 && sed -i '1i import {serveStatic} from "@hono/node-server/serve-static";' src/index.ts\
 && sed -i '27i app.use("/*",serveStatic({root:"/app/static"}));' src/index.ts\
 && sed -i '28i app.use("*",serveStatic({path:"/app/static/index.html"}));' src/index.ts\
 && npx esbuild src/index.ts --bundle --platform=node --target=node20 --outfile=dist/index.js\
 && mv node_modules/symbol-crypto-wasm-node/symbol_crypto_wasm_bg.wasm dist/\
 && mv dist /app/server\
 && cd /\
 && rm -fr /build

FROM node:20.14.0-alpine

WORKDIR /

COPY --from=builder /app /app

CMD ["node", "/app/server/index.js"]
