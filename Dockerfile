FROM node:22

# Install Python3 and requests
RUN apt-get update && apt-get install -y python3 python3-requests

# Set working directory
WORKDIR /app

# Copy package files and install Node dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Start the server
CMD ["node", "server.js"]
