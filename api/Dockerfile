FROM node:14-alpine

WORKDIR /usr/src/app

COPY ["package.json", "yarn.lock", "./"]

RUN yarn install --production

COPY ./build .

EXPOSE 5000
CMD [ "node", "index.js" ]