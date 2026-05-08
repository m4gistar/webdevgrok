'use strict';

import express from 'express';
import routes from "./routes.js";
import logger from "./utils/logger.js";
import { create } from 'express-handlebars';
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";

const app = express();
const port = 3000;

// ====================== Middleware ======================
app.use(express.static("public"));                    // Serve static files (css, images, uploads)
app.use(express.urlencoded({ extended: true }));      // Parse form data
app.use(cookieParser());                              // Parse cookies (useful for Part 2 auth)
app.use(fileUpload({                                  // File upload support
  useTempFiles: true,
  tempFileDir: '/tmp/',
  createParentPath: true
}));

// ====================== Handlebars Setup ======================
const handlebars = create({
  extname: '.hbs',
  defaultLayout: 'main',        // Make sure you have views/layouts/main.hbs
  helpers: {
    // Custom helpers
    getTypeColor: (type) => {
      return type === 'official' ? 'orange' : 'blue';
    },

    getRarityColor: (rarity) => {
      switch(rarity) {
        case "Consumer":    return "#d1d5db";
        case "Industrial":  return "#94a3b8";
        case "Mil-Spec":    return "#3b82f6";
        case "Restricted":  return "#a855f7";
        case "Classified":  return "#ec4899";
        case "Covert":      return "#ef4444";
        default:            return "#888888";
      }
    },

    // You can add more helpers here later
    uppercase: (str) => str ? str.toUpperCase() : '',
    formatDate: (date) => {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleDateString('en-IE', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  }
});

app.engine('.hbs', handlebars.engine);
app.set('view engine', '.hbs');

// ====================== Routes ======================
app.use("/", routes);

// Start Server
app.listen(port, () => {
  logger.info(`Your SkinB4se app is listening on port ${port}`);
});