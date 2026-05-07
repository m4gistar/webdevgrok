'use strict';

import express from 'express';
import logger from "./utils/logger.js";
import appStore from './models/app-store.js';

const router = express.Router();

// ====================== Middleware ======================
router.use(express.urlencoded({ extended: true }));

// ====================== Handlebars Helpers ======================
router.use((req, res, next) => {
  res.locals.getTypeColor = (type) => {
    return type === 'official' ? 'orange' : 'blue';
  };

  res.locals.getRarityColor = (rarity) => {
    switch(rarity) {
      case "Consumer":    return "#d1d5db";
      case "Industrial":  return "#94a3b8";
      case "Mil-Spec":    return "#3b82f6";
      case "Restricted":  return "#a855f7";
      case "Classified":  return "#ec4899";
      case "Covert":      return "#ef4444";
      default:            return "#888888";
    }
  };
  next();
});

console.log("✅ Routes and helpers loaded successfully");

// ====================== Routes ======================

// Home
router.get('/', async (req, res) => {
  const data = appStore.getData();
  res.render('start', { collections: data.collections || [] });
});

// Dashboard
router.get('/dashboard', async (req, res) => {
  const data = appStore.getData();
  res.render('dashboard', { collections: data.collections || [] });
});

// Collection Details
router.get('/collection/:id', async (req, res) => {
  const data = appStore.getData();
  const collection = data.collections.find(c => c.id == req.params.id);
  
  if (!collection) {
    return res.render('error', { message: 'Collection not found' });
  }

  const allGuns = [
    ...data.guns.pistols || [],
    ...data.guns.rifles || [],
    ...data.guns.snipers || [],
    ...data.guns.smgs || [],
    ...data.guns.heavy || []
  ].sort();

  res.render('collection', { 
    collection: collection,
    guns: { all: allGuns }
  });
});

// Add Skin
router.post('/collection/:id/add-skin', async (req, res) => {
  const { gun, skinname, rarity } = req.body;
  const collectionId = parseInt(req.params.id);

  const newSkin = {
    id: Date.now(),
    gun,
    skinname,
    rarity
  };

  await appStore.addItem('collections', collectionId, 'items', newSkin);
  res.redirect(`/collection/${collectionId}`);
});

// Delete Skin
router.get('/collection/:collectionId/delete-skin/:skinId', async (req, res) => {
  const collectionId = parseInt(req.params.collectionId);
  const skinId = parseInt(req.params.skinId);

  await appStore.removeItem('collections', collectionId, 'items', skinId);
  res.redirect(`/collection/${collectionId}`);
});

export default router;