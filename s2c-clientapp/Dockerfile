FROM node:16-alpine3.11
WORKDIR /code
ADD ./package.json ./yarn.* /tmp/
EXPOSE 3001
RUN ["yarn", "install"]
RUN ["yarn", "start"]