'use strict';

// This file manages all official collections and the list of guns.
// It uses lowdb to read/write the app-store.json file.

import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url)); // Gets the folder this file is in
const adapter = new JSONFile(join(__dirname, 'app-store.json')); // Points to the JSON file that stores official data

// Default data that lowdb will use if the file is empty or missing
const defaultData = { 
  collections: [], 
  guns: {
    pistols: ["Glock-18", "P2000", "USP-S", "P250", "CZ75-Auto", "Desert Eagle", "R8 Revolver", "Dual Berettas", "Five-SeveN", "Tec-9"],
    rifles: ["AK-47", "M4A4", "M4A1-S", "FAMAS", "Galil AR", "AUG", "SG 553"],
    snipers: ["AWP", "SSG 08", "SCAR-20", "G3SG1"],
    smgs: ["MAC-10", "MP9", "MP7", "MP5-SD", "UMP-45", "P90", "PP-Bizon"],
    heavy: ["Nova", "XM1014", "Sawed-Off", "MAG-7", "M249", "Negev"]
  } 
};

const db = new Low(adapter, defaultData); // Creates the lowdb instance with default data

await db.read(); // Loads the JSON file into memory
await db.write(); // Makes sure the file exists with defaults if it was missing

const appStore = {

  // Returns all official data (collections + guns)
  async getData() {
    await db.read(); // Refresh data from file in case it changed
    return db.data; // Return the whole object
  },

  // Adds a new official collection to the store
  async addCollection(collection) {
    await db.read(); // Make sure we have latest data
    db.data.collections.push(collection); // Add the new collection to the array
    await db.write(); // Save changes to app-store.json
    return collection; // Return the added collection
  },

  // Removes an official collection by its id
  async removeCollection(id) {
    await db.read(); // Refresh data
    db.data.collections = db.data.collections.filter(c => c.id != id); // Remove the matching collection
    await db.write(); // Save the updated list
  },

  // Adds a skin to an official collection
  async addSkin(collectionId, skin) {
    await db.read(); // Refresh data
    const collection = db.data.collections.find(c => c.id == collectionId); // Find the correct collection
    if (collection) {
      collection.items ||= []; // Make sure items array exists
      collection.items.push(skin); // Add the new skin
      await db.write(); // Save changes
    }
  },

  // Removes a skin from an official collection
  async removeSkin(collectionId, skinId) {
    await db.read(); // Refresh data
    const collection = db.data.collections.find(c => c.id == collectionId); // Find the collection
    if (collection && collection.items) {
      collection.items = collection.items.filter(s => s.id != skinId); // Remove the matching skin
      await db.write(); // Save changes
    }
  },

  // Finds a single official collection by id
  async findById(id) {
    await db.read(); // Refresh data
    return db.data.collections.find(c => c.id == id); // Return the matching collection or undefined
  }
};

export default appStore; // Export so routes.js and other files can use it