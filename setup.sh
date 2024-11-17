#!/bin/bash

# Check if project name is provided
if [ -z "$1" ]; then
    echo "Please provide a project name"
    echo "Usage: ./setup.sh <project-name>"
    exit 1
fi

PROJECT_NAME=$1

# Create src directory if it doesn't exist
mkdir -p src

# Create package.json if it doesn't exist
if [ ! -f package.json ]; then
    npm init -y
    # Update package name in package.json
    sed -i '' "s/\"name\": \".*\"/\"name\": \"$PROJECT_NAME\"/" package.json 2>/dev/null || \
    sed -i "s/\"name\": \".*\"/\"name\": \"$PROJECT_NAME\"/" package.json
fi

# Install core dependencies
npm install neo4j-driver openai

# Install TypeScript and type definitions
npm install -D typescript @types/node

# Create tsconfig.json if it doesn't exist
if [ ! -f tsconfig.json ]; then
    echo '{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}' > tsconfig.json
fi

echo "Setup complete! Project '$PROJECT_NAME' created"
echo "Dependencies installed and TypeScript configured." 