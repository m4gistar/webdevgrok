'use strict';

import express from 'express';
import routes from "./routes.js";
import logger from "./utils/logger.js";
import { create } from 'express-handlebars';
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import session from "express-session";

const app = express();
const port = 3000;

// ====================== Middleware ======================
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(fileUpload({ useTempFiles: true }));

// Session middleware - REQUIRED for login state to persist
app.use(session({
  secret: 'skinb4se-secret-key',   
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }        // Set to true when using HTTPS
}));

// HANDLEBARS
//rarity colours
const handlebars = create({
  extname: '.hbs',
  helpers: {
    getTypeColor: (type) => type === 'official' ? 'orange' : 'blue',
    getRarityColor: (rarity) => {
      switch(rarity) {
        case "Consumer": return "#d1d5db";
        case "Industrial": return "#94a3b8";
        case "Mil-Spec": return "#3b82f6";
        case "Restricted": return "#a855f7";
        case "Classified": return "#ec4899";
        case "Covert": return "#ef4444";
        default: return "#888888";
      }
    }
  }
});

app.engine('.hbs', handlebars.engine);
app.set('view engine', '.hbs');

// ROUTES
app.use("/", routes);

app.listen(port, () => {
  logger.info(`Your SkinB4se app is listening on port ${port}`);
});