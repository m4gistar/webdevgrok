'use strict';

import express from 'express';
import logger from "./utils/logger.js";
import appStore from './models/app-store.js';

const router = express.Router();

// ====================== MIDDLEWARE ======================
router.use(express.urlencoded({ extended: true }));   // ← This is critical for forms

// ====================== Helpers ======================
router.use((req, res, next) => {
  res.locals.getTypeColor = (type) => type === 'official' ? 'orange' : 'blue';

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

console.log("✅ Routes loaded successfully");

// ====================== ROUTES ======================

// Home
router.get('/', (req, res) => {
  const data = appStore.getData();
  res.render('start', { collections: data.collections || [] });
});

// Dashboard
router.get('/dashboard', (req, res) => {
  const data = appStore.getData();
  res.render('dashboard', { collections: data.collections || [] });
});

// Collection Details
router.get('/collection/:id', (req, res) => {
  const data = appStore.getData();
  const collection = data.collections.find(c => c.id == req.params.id);
  
  if (!collection) return res.render('error', { message: 'Collection not found' });

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
  console.log("Received form data:", req.body);   // ← Helpful for debugging

  const { gun, skinname, rarity } = req.body;
  const collectionId = parseInt(req.params.id);

  if (!gun || !skinname || !rarity) {
    return res.send("Error: Missing fields");
  }

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

// ====================== Add New Collection with Image Upload ======================
router.post('/collection/add', async (req, res) => {
  try {
    const { name, type } = req.body;
    const image = req.files ? req.files.image : null;

    if (!name || !type) {
      return res.send("Error: Name and Type are required");
    }

    let imagePath = "/uploads/collections/default_collection.png";

    if (image) {
      const uploadPath = `./public/uploads/collections/${name.toLowerCase().replace(/\s+/g, '_')}_collection.png`;
      await image.mv(uploadPath);   // Move uploaded file
      imagePath = `/uploads/collections/${name.toLowerCase().replace(/\s+/g, '_')}_collection.png`;
    }

    const newCollection = {
      id: Date.now(),
      name: name.trim(),
      type: type,
      image: imagePath,
      items: []
    };

    await appStore.addCollection('collections', newCollection);
    res.redirect('/dashboard');

  } catch (err) {
    console.error(err);
    res.send("Error uploading image: " + err.message);
  }
});
// Delete Entire Collection
router.get('/collection/:id/delete', async (req, res) => {
  const collectionId = parseInt(req.params.id);
  
  await appStore.removeCollection('collections', collectionId);
  res.redirect('/dashboard');
});

// View 4 - Tradeup Calculator
router.get('/calculator', async (req, res) => {
  const data = appStore.getData();
  res.render('calculator', { 
    title: 'Tradeup Calculator',
    collections: data.collections || []
  });
});

// About Page (View 5)
router.get('/about', (req, res) => {
  res.render('about', { 
    title: 'About SkinB4se' 
  });
});

export default router;