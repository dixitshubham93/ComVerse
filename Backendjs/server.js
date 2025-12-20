import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./src/app.js";
import { initSocket } from "./src/config/socket.js";

const server = http.createServer(app);

// Fix for BigInt serialization in JSON.stringify (used by Socket.io)
BigInt.prototype.toJSON = function() {
  return this.toString();
};

initSocket(server);

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Backend-js running on port ${PORT}`);
});
