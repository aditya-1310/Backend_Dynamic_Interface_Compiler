FROM node:22

# Create app directory
WORKDIR /app

# Install dependencies (cached if package.json doesn't change)
COPY package*.json ./
RUN npm install --production

# Copy app source
COPY . .

# Expose port for the backend
EXPOSE 3000

# Start the app in production mode
CMD ["npm", "start"]
