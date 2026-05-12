'use strict';

import userStore from '../models/user-store.js';

const accounts = {

 index(req, res) {
 res.render('start');
 },

 login(req, res) {
 res.render('login', { title: 'Login' });
 },

 signup(req, res) {
 res.render('signup', { title: 'Sign Up' });
 },

 async register(req, res) {
 const { username, email, password } = req.body;

 if (!username || !email || !password) {
 return res.render('signup', { error: "All fields are required" });
 }

 const existing = await userStore.findByUsernameOrEmail(username) || 
 await userStore.findByUsernameOrEmail(email);

 if (existing) {
 return res.render('signup', { error: "Username or email already taken" });
 }

 const newUser = {
 id: Date.now(),
 username,
 email,
 password,
 admin: false,
 bio: "",
 profileImage: "/uploads/info/defaultpfp.png"
 };

 await userStore.addUser(newUser);
 res.redirect('/login');
 },

 async authenticate(req, res) {
 const { identifier, password } = req.body;

 const user = await userStore.findByUsernameOrEmail(identifier);

 if (!user || user.password !== password) {
 return res.render('login', { error: "Invalid username/email or password" });
 }

 req.session = req.session || {};
 req.session.user = {
 id: user.id,
 username: user.username,
 email: user.email,
 admin: user.admin,
 bio: user.bio || "",
 profileImage: user.profileImage || "/uploads/info/defaultpfp.png"
 };

 res.redirect('/dashboard');
 },

 logout(req, res) {
 if (req.session) req.session = null;
 res.redirect('/');
 },

 // Account Page
 account(req, res) {
 if (!req.session || !req.session.user) {
 return res.redirect('/login');
 }
 res.render('account', { 
 title: 'My Account',
 user: req.session.user 
 });
 },

 // Update Bio
 async updateBio(req, res) {
 if (!req.session || !req.session.user) return res.redirect('/login');

 const { bio } = req.body;
 const user = await userStore.findByUsername(req.session.user.username);

 if (user) {
 user.bio = bio || "";
 req.session.user.bio = bio;
 await userStore.save(); // Make sure userStore has a save method
 }

 res.redirect('/account');
 },

  // Upload Profile Picture + sync to private collections
  async uploadProfile(req, res) {
    if (!req.session || !req.session.user) return res.redirect('/login');

    try {
      if (req.files && req.files.profileImage) {
        const image = req.files.profileImage;
        const username = req.session.user.username;
        const filename = `${username}.png`;
        const uploadPath = `./public/uploads/profiles/${filename}`;

        await image.mv(uploadPath);

        const user = await userStore.findByUsername(username);
        if (user) {
          user.profileImage = `/uploads/profiles/${filename}`;
          req.session.user.profileImage = user.profileImage;
          await userStore.save();

          // Update ALL private collections owned by this user
          const userData = await userCollections.getAll();
          for (const col of userData) {
            if (col.ownerId === user.id) {
              col.image = user.profileImage;
            }
          }
          await userCollections.save();
        }
      }
      res.redirect('/account');
    } catch (err) {
      console.error(err);
      res.redirect('/account');
    }
  }
};

export default accounts;