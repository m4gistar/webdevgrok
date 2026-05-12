'use strict';

import express from 'express';
import logger from "./utils/logger.js";
import appStore from './models/app-store.js';
import accounts from './controllers/accounts.js';
import userCollections from './models/user-collections.js';

const router = express.Router();

// Middleware
router.use(express.urlencoded({ extended: true }));

// Pass session to views
router.use((req, res, next) => {
  res.locals.session = req.session || {};
  next();
});

// Helpers
router.use((req, res, next) => {
  res.locals.getTypeColor = (type) => type === 'official' ? 'orange' : 'blue';
  res.locals.getRarityColor = (rarity) => {
    switch(rarity) {
      case "Consumer": return "#d1d5db";
      case "Industrial": return "#94a3b8";
      case "Mil-Spec": return "#3b82f6";
      case "Restricted": return "#a855f7";
      case "Classified": return "#ec4899";
      case "Covert": return "#ef4444";
      default: return "#888888";
    }
  };
  res.locals.JSONstringify = (context) => JSON.stringify(context);
  next();
});

console.log("✅ Routes and helpers loaded successfully");

// ====================== Routes ======================

router.get('/', accounts.index);

// Accounts
router.get('/login', accounts.login);
router.get('/signup', accounts.signup);
router.get('/logout', accounts.logout);
router.post('/register', accounts.register);
router.post('/authenticate', accounts.authenticate);
router.get('/account', accounts.account);
router.post('/account/update-bio', accounts.updateBio);
router.post('/account/upload-profile', accounts.uploadProfile);

// Dashboard
router.get('/dashboard', async (req, res) => {
  const appData = appStore.getData();
  const userData = await userCollections.getAll();
  res.render('dashboard', { collections: [...appData.collections, ...userData] });
});

// Collection Details
router.get('/collection/:id', async (req, res) => {
  const appData = appStore.getData();
  let collection = appData.collections.find(c => c.id == req.params.id);

  if (!collection) {
    const userData = await userCollections.getAll();
    collection = userData.find(c => c.id == req.params.id);
  }

  if (!collection) {
    return res.render('error', { message: 'Collection not found' });
  }

  res.render('collection', { 
    collection: collection,
    guns: appData.guns,
    isOwner: req.session?.user && (req.session.user.id == collection.ownerId || req.session.user.admin)
  });
});

// User Collection CRUD
router.post('/collection/add', async (req, res) => {
  if (!req.session?.user) return res.redirect('/login');
  const { name } = req.body;
  const newCollection = {
    id: Date.now(),
    name: name.trim(),
    type: "user",
    ownerId: req.session.user.id,
    image: req.session.user.profileImage || "/uploads/info/defaultpfp.png",
    items: []
  };
  await userCollections.addCollection(newCollection);
  res.redirect('/dashboard');
});

router.post('/collection/:id/add-skin', async (req, res) => {
  if (!req.session?.user) return res.redirect('/login');
  const collectionId = parseInt(req.params.id);
  const { gun, skinname, rarity } = req.body;
  const newSkin = { id: Date.now(), gun, skinname, rarity };
  await userCollections.addSkin(collectionId, newSkin);
  res.redirect(`/collection/${collectionId}`);
});

router.get('/collection/:collectionId/delete-skin/:skinId', async (req, res) => {
  if (!req.session?.user) return res.redirect('/login');
  const collectionId = parseInt(req.params.collectionId);
  const skinId = parseInt(req.params.skinId);
  await userCollections.removeSkin(collectionId, skinId);
  res.redirect(`/collection/${collectionId}`);
});

router.get('/collection/:id/delete', async (req, res) => {
  if (!req.session?.user) return res.redirect('/login');
  const collectionId = parseInt(req.params.id);
  const collection = await userCollections.findById(collectionId);
  if (!collection) return res.redirect('/dashboard');
  const isOwnerOrAdmin = req.session.user.id == collection.ownerId || req.session.user.admin;
  if (isOwnerOrAdmin) {
    await userCollections.removeCollection(collectionId);
  }
  res.redirect('/dashboard');
});

// Calculator & About
router.get('/calculator', (req, res) => {
  const data = appStore.getData();
  res.render('calculator', { collections: data.collections || [] });
});

router.get('/about', (req, res) => {
  res.render('about', { title: 'About SkinB4se' });
});

export default router;