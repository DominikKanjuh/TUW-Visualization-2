FROM node:20-alpine

WORKDIR /app

COPY frontend/package*.json ./

RUN npm install

COPY frontend/ .

RUN npm run build

RUN npm install -g http-server

EXPOSE 9090

CMD ["npm", "run", "start"]
