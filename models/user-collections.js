'use strict';

const userCollections = {
  collections: [],

  async getAll() {
    return this.collections;
  },

  async findById(id) {
    return this.collections.find(c => c.id == id);
  },

  async addCollection(collection) {
    this.collections.push(collection);
    return collection;
  },

  async removeCollection(id) {
    const index = this.collections.findIndex(c => c.id == id);
    if (index > -1) {
      this.collections.splice(index, 1);
    }
  },

  async addSkin(collectionId, skin) {
    const collection = this.collections.find(c => c.id == collectionId);
    if (collection) {
      collection.items.push(skin);
    }
  },

  async removeSkin(collectionId, skinId) {
    const collection = this.collections.find(c => c.id == collectionId);
    if (collection) {
      const index = collection.items.findIndex(i => i.id == skinId);
      if (index > -1) {
        collection.items.splice(index, 1);
      }
    }
  }
};

export default userCollections;