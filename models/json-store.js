'use strict';

import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, 'app-store.json');

const defaults = {
  collections: [],
  guns: {
    pistols: [],
    rifles: [],
    snipers: [],
    smgs: [],
    heavy: []
  }
};

class JsonStore {
  constructor() {
    this.db = new Low(new JSONFile(file), defaults);
  }

  async init() {
    await this.db.read();
    await this.db.write(); // Creates file if it doesn't exist
    return this;
  }

  getData() {
    return this.db.data;
  }

  async save() {
    await this.db.write();
  }

  // === Your existing methods (kept + slightly improved) ===

  findAll(collection) {
    return this.db.data[collection] || [];
  }

  findBy(collection, filter) {
    return this.db.data[collection].filter(filter);
  }

  findOneBy(collection, filter) {
    return this.db.data[collection].find(filter);
  }

  async addCollection(collectionName, obj) {
    this.db.data[collectionName].push(obj);
    await this.save();
  }

  async addItem(collection, id, arr, obj) {
    const item = this.db.data[collection].find(c => c.id === id);
    if (item) {
      item[arr].push(obj);
      await this.save();
    }
  }

  async removeCollection(collection, id) {
    const index = this.db.data[collection].findIndex(item => item.id === id);
    if (index > -1) {
      this.db.data[collection].splice(index, 1);
      await this.save();
    }
  }

  async removeItem(collection, id, arr, itemId) {
    const col = this.db.data[collection].find(c => c.id === id);
    if (col) {
      const index = col[arr].findIndex(i => i.id === itemId);
      if (index > -1) {
        col[arr].splice(index, 1);
        await this.save();
      }
    }
  }

  async editCollection(collection, id, newObj) {
    const index = this.db.data[collection].findIndex(c => c.id === id);
    if (index > -1) {
      this.db.data[collection][index] = newObj;
      await this.save();
    }
  }

  async editItem(collection, id, itemId, arr, newObj) {
    const col = this.db.data[collection].find(c => c.id === id);
    if (col) {
      const index = col[arr].findIndex(i => i.id === itemId);
      if (index > -1) {
        col[arr][index] = newObj;
        await this.save();
      }
    }
  }
}

const jsonStore = new JsonStore();
await jsonStore.init();

export default jsonStore;