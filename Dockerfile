FROM node:18-alpine
ENV NODE_OPTIONS --openssl-legacy-provider
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app/
COPY ./package.json ./package-lock.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["node","/usr/src/app/index.js"]