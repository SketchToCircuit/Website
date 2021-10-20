# syntax=docker/dockerfile:2
FROM node:16-alpine3.11
WORKDIR /code
RUN apk add --no-cache gcc musl-dev linux-headers
COPY package.json package.json
RUN yarn install
EXPOSE 3000
COPY . .
CMD ["yarn", "start"]