FROM mcr.microsoft.com/playwright:v1.59.1-jammy

WORKDIR /app

# We are using a playwright image which comes with Node.js
COPY package*.json ./
RUN npm install

COPY . .

# Expose port and start
EXPOSE 4000
CMD ["npm", "run", "dev"]
