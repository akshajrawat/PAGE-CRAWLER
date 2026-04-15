# Start with a lightweight Linux machine that has Node.js installed
FROM node:20-alpine

# reate a working directory inside the container
WORKDIR /app

# Copy your dependency lists first (for caching efficiency)
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy the rest of code into the container
COPY . .
