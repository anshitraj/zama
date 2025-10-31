import "dotenv/config";
import { app } from "./app";
import { ethListener } from "./services/ethListener";

const PORT = process.env.BACKEND_PORT || 3001;

async function startServer() {
  try {
    // Start Ethereum event listener
    console.log("Starting Ethereum event listener...");
    ethListener.start();
    
    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`🚀 Backend server running on http://localhost:${PORT}`);
      console.log(`📊 API docs: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

