# Start from an official Node.js image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your app
COPY . .

# Expose the port your app runs on
EXPOSE 3001

# Command to run your app
CMD ["node", "server.js"]