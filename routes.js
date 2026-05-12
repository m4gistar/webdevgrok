'use strict';

//Hope I never need to build ts again

import express from 'express';
import logger from "./utils/logger.js";
import appStore from './models/app-store.js';
import userCollections from './models/user-collections.js';
import accounts from './controllers/accounts.js';

const router = express.Router();

// Middleware that runs on every request
router.use(express.urlencoded({ extended: true }));  // Allows us to read form data (POST bodies)
router.use((req, res, next) => {
  res.locals.session = req.session || {};  // Makes the loggedin user data available in every Handlebars template
  next();
});

// Global Handlebars helpers that are available in all views
router.use((req, res, next) => {
  res.locals.getTypeColor = (type) => type === 'official' ? 'orange' : 'blue';  // Used for official vs private collection badges
  res.locals.getRarityColor = (rarity) => {  // Returns the correct color for each skin rarity
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
  res.locals.JSONstringify = (context) => JSON.stringify(context);  // Used to safely pass data to jkavaScript in templates
  next();
});

// ====================== ROUTES ======================

// Start page (homepage) - shows welcome screen + statistics
router.get('/', async (req, res) => {
  const appData = await appStore.getData(); // Load all official collections
  const userData = await userCollections.getAll(); // Load all private collections
  const userStoreData = await accounts.getAllUsers(); // Load all registered users

  const totalOfficial = appData.collections ? appData.collections.length : 0;
  const totalPrivate = userData.length;
  const totalUsers = userStoreData.length;

  let totalSkins = 0;
  if (appData.collections) appData.collections.forEach(c => { if (c.items) totalSkins += c.items.length; });
  userData.forEach(c => { if (c.items) totalSkins += c.items.length; });

  res.render('start', { totalOfficial, totalPrivate, totalUsers, totalSkins });
});

// Account routes - login, signup, logout, account page
router.get('/login', accounts.login);
router.get('/signup', accounts.signup);
router.get('/logout', accounts.logout);
router.post('/register', accounts.register);
router.post('/authenticate', accounts.authenticate);
router.get('/account', accounts.account);
router.post('/account/update-bio', accounts.updateBio);
router.post('/account/upload-profile', accounts.uploadProfile);

// Dashboard - main page with search filters and collection browsing
router.get('/dashboard', async (req, res) => {
  const appData = await appStore.getData();
  const userData = await userCollections.getAll();
  const collections = [...(appData.collections || []), ...userData];
  const officialCollections = (appData.collections || []).filter(c => c.type === "official");
  const privateCollections = userData;

  // Unique collection names for the new Collection dropdown filter
  const collectionNames = [...new Set(collections.map(c => c.name))].sort();

  res.render('dashboard', { 
    collections, 
    officialCollections, 
    privateCollections,
    collectionNames 
  });
});

// Collection detail page - shows skins and smart search for private collections
router.get('/collection/:id', async (req, res) => {
  let collection = (await appStore.getData()).collections.find(c => c.id == req.params.id);
  let isOfficial = !!collection;

  if (!collection) {
    const userData = await userCollections.getAll();
    collection = userData.find(c => c.id == req.params.id);
  }

  if (!collection) return res.render('error', { message: 'Collection not found' });

  const isAdmin = req.session?.user?.admin === true;
  const isOwner = req.session?.user && (req.session.user.id == collection.ownerId);

  const canAddOrDeleteSkins = isOfficial ? isAdmin : isOwner;
  const canDeleteCollection = isAdmin || isOwner;

  let officialSkins = [];
  if (!isOfficial && isOwner) {
    const appData = await appStore.getData();
    officialSkins = [];
    appData.collections.forEach(col => {
      if (col.type === "official" && col.items) {
        col.items.forEach(skin => {
          officialSkins.push({
            id: skin.id,
            gun: skin.gun,
            skinname: skin.skinname,
            rarity: skin.rarity,
            display: `${skin.gun} | ${skin.skinname}`
          });
        });
      }
    });
  }

  res.render('collection', { 
    collection,
    isOfficial,
    isOwner,
    isAdmin,
    canAddOrDeleteSkins,
    canDeleteCollection,
    officialSkins,
    guns: (await appStore.getData()).guns
  });
});

// Create new collection (official or private)
router.post('/collection/add', async (req, res) => {
  if (!req.session?.user) return res.redirect('/login');
  const { name } = req.body;
  const isAdmin = req.session.user.admin === true;
  const collectionName = name.trim();

  if (isAdmin) {
    if (!req.files || !req.files.image) {
      return res.render('dashboard', { error: "Official collections require an image", collections: [] });
    }
    const image = req.files.image;
    const filename = `${collectionName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_collection.png`;
    const uploadPath = `./public/uploads/collections/${filename}`;
    await image.mv(uploadPath);

    const newOfficial = {
      id: Date.now(),
      name: collectionName,
      type: "official",
      image: `/uploads/collections/${filename}`,
      items: []
    };
    await appStore.addCollection(newOfficial);
  } else {
    const newCollection = {
      id: Date.now(),
      name: collectionName,
      type: "user",
      ownerId: req.session.user.id,
      image: req.session.user.profileImage || "/uploads/info/defaultpfp.png",
      items: []
    };
    await userCollections.addCollection(newCollection);
  }
  res.redirect('/dashboard');
});

// Add official skin to private collection (smart search)
router.post('/collection/:id/add-official-skin', async (req, res) => {
  if (!req.session?.user) return res.redirect('/login');
  const collectionId = parseInt(req.params.id);
  const { officialSkinId } = req.body;

  const collection = await userCollections.findById(collectionId);
  if (!collection || req.session.user.id != collection.ownerId) {
    return res.redirect('/dashboard');
  }

  const appData = await appStore.getData();
  let skinToAdd = null;
  for (const col of appData.collections) {
    if (col.type === "official" && col.items) {
      const found = col.items.find(s => s.id == officialSkinId);
      if (found) {
        skinToAdd = { ...found };
        break;
      }
    }
  }

  if (skinToAdd) {
    await userCollections.addSkin(collectionId, skinToAdd);
  }
  res.redirect(`/collection/${collectionId}`);
});

// Add new skin manually (only used by official collections)
router.post('/collection/:id/add-skin', async (req, res) => {
  if (!req.session?.user) return res.redirect('/login');
  const collectionId = parseInt(req.params.id);
  const { gun, skinname, rarity } = req.body;
  const newSkin = { id: Date.now(), gun, skinname, rarity };

  const isAdmin = req.session.user.admin === true;

  let collection = await appStore.findById(collectionId);
  if (collection) {
    if (isAdmin) {
      await appStore.addSkin(collectionId, newSkin);
      return res.redirect(`/collection/${collectionId}`);
    }
    return res.redirect('/dashboard');
  }
  res.redirect(`/collection/${collectionId}`);
});

// Delete individual skin
router.get('/collection/:collectionId/delete-skin/:skinId', async (req, res) => {
  if (!req.session?.user) return res.redirect('/login');
  const collectionId = parseInt(req.params.collectionId);
  const skinId = parseInt(req.params.skinId);
  const isAdmin = req.session.user.admin === true;

  let collection = await appStore.findById(collectionId);
  if (collection) {
    if (isAdmin) await appStore.removeSkin(collectionId, skinId);
    return res.redirect(`/collection/${collectionId}`);
  }

  collection = await userCollections.findById(collectionId);
  if (collection && req.session.user.id == collection.ownerId) {
    await userCollections.removeSkin(collectionId, skinId);
  }
  res.redirect(`/collection/${collectionId}`);
});

// Delete entire collection
router.get('/collection/:id/delete', async (req, res) => {
  if (!req.session?.user) return res.redirect('/login');
  const collectionId = parseInt(req.params.id);
  const isAdmin = req.session.user.admin === true;

  let collection = await appStore.findById(collectionId);
  if (collection) {
    if (isAdmin) await appStore.removeCollection(collectionId);
    return res.redirect('/dashboard');
  }

  collection = await userCollections.findById(collectionId);
  if (collection && (req.session.user.id == collection.ownerId || isAdmin)) {
    await userCollections.removeCollection(collectionId);
  }
  res.redirect('/dashboard');
});

// Trade-up calculator page
router.get('/calculator', async (req, res) => {
  const data = await appStore.getData();
  res.render('calculator', { collections: data.collections || [] });
});

// About page with statistics
router.get('/about', async (req, res) => {
  const appData = await appStore.getData();
  const userData = await userCollections.getAll();
  const userStoreData = await accounts.getAllUsers();

  const totalOfficial = appData.collections ? appData.collections.length : 0;
  const totalPrivate = userData.length;
  const totalUsers = userStoreData.length;

  let totalSkins = 0;
  if (appData.collections) appData.collections.forEach(c => { if (c.items) totalSkins += c.items.length; });
  userData.forEach(c => { if (c.items) totalSkins += c.items.length; });

  res.render('about', { 
    totalOfficial,
    totalPrivate,
    totalUsers,
    totalSkins,
    title: 'About SkinB4se'
  });
});

export default router;