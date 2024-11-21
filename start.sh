# Create the start.sh file
echo '#!/bin/bash
export VITE_APP_HOST="0.0.0.0"
export VITE_APP_PORT=5173
npm run dev' > start.sh

# Make it executable
chmod +x start.sh