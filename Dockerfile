FROM node:15-buster

COPY . /app
WORKDIR /app
RUN yarn install
ENTRYPOINT ["node"]
CMD ["src/api.js"]
