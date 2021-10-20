# syntax=docker/dockerfile:1
FROM node:16-alpine3.11
WORKDIR /code
RUN apk add --no-cache gcc musl-dev linux-headers
COPY package.json package.json
RUN yarn install
EXPOSE 3001
COPY . .
CMD ["yarn", "start"]