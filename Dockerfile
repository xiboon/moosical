FROM node:20-alpine

WORKDIR /usr/src/app
COPY package*.json ./
# install dependencies (ffmpeg and libvips)
RUN apk add --no-cache ffmpeg vips

COPY . .
RUN npm install
RUN npx prisma db push
RUN npx tsc
# prepare
CMD [ "npm", "run", "docker" ]
