FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY miniapp/package*.json ./miniapp/

# Install dependencies
RUN npm ci
RUN cd miniapp && npm ci

# Copy source code
COPY . .

# Build both project and miniapp
RUN npm run build

EXPOSE 3001

# Start the application
CMD ["npm", "start"]
