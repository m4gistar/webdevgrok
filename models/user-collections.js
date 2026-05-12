'use strict';

// This file manages ALL private (user-created) collections.
// It uses lowdb to read from and write to the user-collections.json file on disk.

import { Low } from 'lowdb'; // Import the main lowdb library
import { JSONFile } from 'lowdb/node'; // Import the file adapter so lowdb can read/write JSON files
import { join, dirname } from 'path'; // Import path utilities to build the correct file path
import { fileURLToPath } from 'url'; // Import to convert import.meta.url to a real file path

const __dirname = dirname(fileURLToPath(import.meta.url)); // Gets the folder this file lives in
const adapter = new JSONFile(join(__dirname, 'user-collections.json')); // Points lowdb to the exact JSON file for private collections

// Default data that lowdb will use if the file is missing or empty
const defaultData = { 
  collections: [] // Empty array that will hold every private collection
};

const db = new Low(adapter, defaultData); // Create lowdb instance with default data (this prevents the "Unexpected end of JSON input" error)

await db.read(); // Load the data from user-collections.json into memory
await db.write(); // Create the file with defaults if it didn't exist or was empty

const userCollections = {

  // Returns every private collection currently saved
  async getAll() {
    await db.read(); // Always refresh from the JSON file in case another part of the app changed it
    return db.data.collections || []; // Return the array of collections (or empty array if none exist)
  },

  // Adds a brand new private collection to the database
  async addCollection(newCollection) {
    await db.read(); // Refresh data before modifying
    db.data.collections.push(newCollection); // Add the new collection object to the array
    await db.write(); // Save the change permanently to user-collections.json
    return newCollection; // Return the collection so the caller can use it if needed
  },

  // Finds and returns a single private collection by its ID
  async findById(id) {
    await db.read(); // Make sure we have the latest data
    return db.data.collections.find(c => c.id == id); // Return the matching collection or undefined if not found
  },

  // Adds a skin to a specific private collection
  async addSkin(collectionId, skin) {
    await db.read(); // Refresh data from file
    const collection = db.data.collections.find(c => c.id == collectionId); // Find the exact private collection we want to modify
    if (collection) {
      collection.items ||= []; // If the items array doesn't exist yet, create an empty array
      collection.items.push(skin); // Add the skin object to this collection's items array
      await db.write(); // Save the updated collection back to the JSON file
    }
  },

  // Removes a specific skin from a private collection
  async removeSkin(collectionId, skinId) {
    await db.read(); // Refresh data
    const collection = db.data.collections.find(c => c.id == collectionId); // Locate the private collection
    if (collection && collection.items) {
      collection.items = collection.items.filter(s => s.id != skinId); // Keep every skin except the one with this ID
      await db.write(); // Save the change to the JSON file
    }
  },

  // Permanently deletes an entire private collection
  async removeCollection(id) {
    await db.read(); // Refresh data before deleting
    db.data.collections = db.data.collections.filter(c => c.id != id); // Remove the collection with matching ID
    await db.write(); // Save the updated list to user-collections.json
  },

  // Saves any in-memory changes (used after profile picture updates that affect collections)
  async save() {
    await db.write(); // Writes whatever is currently in memory back to the JSON file
  }
};

export default userCollections; // Makes all these methods available to other files like routes.js and accounts.js