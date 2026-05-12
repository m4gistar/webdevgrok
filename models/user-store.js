'use strict';

const userStore = {
  users: [
    {
      "id": 1,
      "username": "m4gistar",
      "email": "20118397@setu.ie",
      "password": "ATXTAF4mm",
      "admin": true,
      "bio": "Admin of SkinB4se",
      "profileImage": "/uploads/info/defaultpfp.png"
    }
  ],

  findByUsername(username) {
    return this.users.find(user => user.username === username);
  },

  findByEmail(email) {
    return this.users.find(user => user.email === email);
  },

  findByUsernameOrEmail(identifier) {
    return this.users.find(user => 
      user.username === identifier || user.email === identifier
    );
  },

  addUser(user) {
    this.users.push(user);
    return user;
  },

  save() {
    // For now, we just keep it in memory
    console.log("User data saved (in-memory for now)");
    return true;
  }
};

export default userStore;