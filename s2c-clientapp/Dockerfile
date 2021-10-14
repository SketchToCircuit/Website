FROM node:16-alpine3.11
WORKDIR /code
COPY package.json package.json
RUN yarn install
EXPOSE 3001
CMD ["yarn","run","start"]