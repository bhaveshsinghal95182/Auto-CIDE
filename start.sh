#!/bin/bash

# Start the backend service
cd /app/backend
pnpm start &

# Start the frontend service
cd /app/frontend
node server.js &

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $? 