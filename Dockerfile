# Step 1: Use official Node.js LTS image
FROM node:20-alpine

# Step 2: Set working directory inside container
WORKDIR /usr/src/app

# Step 3: Copy package.json and package-lock.json first
# (This helps leverage Docker layer caching for dependencies)
COPY package*.json ./

# Step 4: Install app dependencies
RUN npm install --production

# Step 5: Copy the rest of the application code
COPY . .

# Step 6: Expose the port your app runs on
EXPOSE 3006

# Step 7: Set environment variables (optional)
ENV NODE_ENV=production

# Step 8: Start the app
# Option 1: Direct Node
CMD ["node", "server.js"]

# Option 2: Using PM2 (uncomment if you prefer PM2)
# RUN npm install -g pm2
# CMD ["pm2-runtime", "server.js"]
