FROM node:15-buster

COPY . /app
WORKDIR /app
RUN yarn install
ENTRYPOINT ["npx", "nodemon"]
CMD ["src/api.js"]
