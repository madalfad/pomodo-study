import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoints
  
  // Get active users count - this is a simulated endpoint
  app.get('/api/active-users', (req, res) => {
    // Generate a random number between 1000 and 1500 to simulate active users
    const count = Math.floor(Math.random() * 500) + 1000;
    res.json({ count });
  });
  
  // For sound files, we're using external CDNs so no need to serve them

  const httpServer = createServer(app);

  return httpServer;
}
