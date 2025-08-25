#!/bin/bash

# Smart Display 2 Startup Script
# This script sets up and starts the smart display application

echo "🚀 Starting Smart Display 2..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Run: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    if [ -f "env.example" ]; then
        cp env.example .env
        echo "📝 Please edit .env file with your API keys and settings"
    else
        echo "❌ env.example not found. Please create .env file manually."
        exit 1
    fi
fi

# Check if Google service account key exists
if [ ! -f "google-service-account-key.json" ]; then
    echo "⚠️  Google service account key not found."
    echo "   Please download your service account key from Google Cloud Console"
    echo "   and place it as 'google-service-account-key.json' in the project root"
fi

echo "✅ Starting Smart Display server..."
echo "🌐 Access the display at: http://localhost:3000"
echo "🔄 Press Ctrl+C to stop the server"

# Start the application
npm start
