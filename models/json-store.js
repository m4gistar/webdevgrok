'use strict';

// This file is a generic JSON store class that can manage any collection of data.
// It is used to read from and write to a JSON file using lowdb.
// This is the older/generic version of the store (different from app-store.js and user-store.js).

import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url)); // Gets the folder this file lives in
const file = join(__dirname, 'app-store.json'); // Builds the full path to the JSON file we are using

// Default structure that will be used if the JSON file does not exist yet
const defaults = {
  collections: [], // Array that will hold all collections
  guns: {
    pistols: [],
    rifles: [],
    snipers: [],
    smgs: [],
    heavy: []
  }
};

class JsonStore { // Main class that handles all JSON file operations

  constructor() {
    this.db = new Low(new JSONFile(file), defaults); // Create lowdb instance with the file and default data
  }

  // Initialize the database (called once when the app starts)
  async init() {
    await this.db.read(); // Load existing data from the JSON file into memory
    await this.db.write(); // Create the file with defaults if it doesn't exist yet
    return this; // Return the instance so it can be chained
  }

  // Returns the current in-memory data object
  getData() {
    return this.db.data; // Return the whole data object (collections + guns)
  }

  // Saves any changes currently in memory back to the JSON file
  async save() {
    await this.db.write(); // Write the current in-memory data to disk
  }

  // === Your existing methods (kept + slightly improved) ===

  // Returns all items from a specific collection (e.g. "collections")
  findAll(collection) {
    return this.db.data[collection] || []; // Return the array or empty array if it doesn't exist
  }

  // Returns items from a collection that match a filter function
  findBy(collection, filter) {
    return this.db.data[collection].filter(filter); // Run the filter function on the collection
  }

  // Returns the first item from a collection that matches a filter function
  findOneBy(collection, filter) {
    return this.db.data[collection].find(filter); // Return the first matching item or undefined
  }

  // Adds a new object to a specific collection
  async addCollection(collectionName, obj) {
    this.db.data[collectionName].push(obj); // Add the object to the end of the array
    await this.save(); // Save the change to the JSON file
  }

  // Adds an item to a nested array inside a collection (e.g. adding a skin to a collection's items)
  async addItem(collection, id, arr, obj) {
    const item = this.db.data[collection].find(c => c.id === id); // Find the parent object by id
    if (item) {
      item[arr].push(obj); // Add the new object to the nested array
      await this.save(); // Save the change to the JSON file
    }
  }

  // Removes an entire object from a collection by its id
  async removeCollection(collection, id) {
    const index = this.db.data[collection].findIndex(item => item.id === id); // Find the index of the item
    if (index > -1) {
      this.db.data[collection].splice(index, 1); // Remove the item from the array
      await this.save(); // Save the change to the JSON file
    }
  }

  // Removes an item from a nested array inside a collection
  async removeItem(collection, id, arr, itemId) {
    const col = this.db.data[collection].find(c => c.id === id); // Find the parent object
    if (col) {
      const index = col[arr].findIndex(i => i.id === itemId); // Find the index of the item to delete
      if (index > -1) {
        col[arr].splice(index, 1); // Remove the item from the nested array
        await this.save(); // Save the change to the JSON file
      }
    }
  }

  // Replaces an entire object in a collection with a new object
  async editCollection(collection, id, newObj) {
    const index = this.db.data[collection].findIndex(c => c.id === id); // Find the index of the object
    if (index > -1) {
      this.db.data[collection][index] = newObj; // Replace the old object with the new one
      await this.save(); // Save the change to the JSON file
    }
  }

  // Replaces an item inside a nested array with a new object
  async editItem(collection, id, itemId, arr, newObj) {
    const col = this.db.data[collection].find(c => c.id === id); // Find the parent object
    if (col) {
      const index = col[arr].findIndex(i => i.id === itemId); // Find the index of the item to edit
      if (index > -1) {
        col[arr][index] = newObj; // Replace the old item with the new one
        await this.save(); // Save the change to the JSON file
      }
    }
  }
}

const jsonStore = new JsonStore(); // Create a single instance of the JsonStore class
await jsonStore.init(); // Initialize the database (load/create the JSON file)

export default jsonStore; // Export the ready-to-use instance so other files can import and use it