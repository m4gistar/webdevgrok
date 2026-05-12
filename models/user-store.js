'use strict';

// This file manages ALL user account data (username, email, password, admin flag, bio, profile picture).
// It uses lowdb to read from and write to the user-store.json file on disk.

import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url)); // Gets the folder this file lives in
const adapter = new JSONFile(join(__dirname, 'user-store.json')); // Points lowdb to the exact JSON file that stores all users

// Default structure that will be created if user-store.json does not exist yet
const defaultData = { 
  users: [] // Empty array that will hold every registered user object
};

const db = new Low(adapter, defaultData); // Creates the lowdb instance and gives it the default data

await db.read(); // Loads the existing data from user-store.json into memory
await db.write(); // Makes sure the file exists on disk with the default structure if it was missing

const userStore = {

  // Returns the complete list of all registered users
  async getAll() {
    await db.read(); // Always refresh from the JSON file in case another part of the app changed it
    return db.data.users || []; // Return the users array (or empty array if none exist)
  },

  // Finds a user by either username or email (used during login and registration checks)
  async findByUsernameOrEmail(identifier) {
    await db.read(); // Refresh data before searching
    return db.data.users.find(user => 
      user.username.toLowerCase() === identifier.toLowerCase() || 
      user.email.toLowerCase() === identifier.toLowerCase()
    ); // Return the matching user object or undefined if no match
  },

  // Finds a user by username only (used when updating bio or profile picture)
  async findByUsername(username) {
    await db.read(); // Refresh data
    return db.data.users.find(user => user.username.toLowerCase() === username.toLowerCase()); // Return the user or undefined
  },

  // Adds a completely new user to the database (called after successful registration)
  async addUser(newUser) {
    await db.read(); // Refresh data before modifying
    db.data.users.push(newUser); // Add the new user object to the users array
    await db.write(); // Save the change permanently to user-store.json
    return newUser; // Return the added user so the caller can use it if needed
  },

  // Saves any in-memory changes back to the JSON file (used after updating bio or profile picture)
  async save() {
    await db.write(); // Writes whatever is currently in memory back to user-store.json
  }
};

export default userStore; // Export the object so controllers/accounts.js and routes.js can use these methods