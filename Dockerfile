FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3080

# Start the application
CMD [ "node", "app.js" ]