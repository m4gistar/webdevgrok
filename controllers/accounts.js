'use strict';

// This file contains all the logic related to user accounts (login, signup, logout, account page, bio update, profile picture upload).

import userStore from '../models/user-store.js'; // Import the user database so we can read and write user data

const accounts = {

  // Renders the homepage when someone visits the root URL '/'
  index(req, res) {
    res.render('start'); // Show the start/welcome page
  },

  // Shows the login form page
  login(req, res) {
    res.render('login', { title: 'Login' }); // Render login.hbs and pass a title for the browser tab
  },

  // Shows the signup form page
  signup(req, res) {
    res.render('signup', { title: 'Sign Up' }); // Render signup.hbs and pass a title for the browser tab
  },

  // Handles new user registration when the signup form is submitted
  async register(req, res) {
    const { username, email, password } = req.body; // Extract the three fields the user entered in the form

    if (!username || !email || !password) { // Check if any required field is missing
      return res.render('signup', { error: "All fields are required" }); // Show signup page again with error message
    }

    const existing = await userStore.findByUsernameOrEmail(username) || 
                     await userStore.findByUsernameOrEmail(email); // Check if username or email is already taken

    if (existing) { // If a user with that name or email already exists
      return res.render('signup', { error: "Username or email already taken" }); // Show error and stay on signup page
    }

    const isAdminUser = username.toLowerCase() === 'm4gistar'; // Only the exact username "m4gistar" becomes admin

    const newUser = { // Create the new user object that will be saved
      id: Date.now(), // Generate a unique ID using current timestamp
      username, // Store the chosen username
      email, // Store the chosen email
      password, // Store the chosen password (plain text in this simple app)
      admin: isAdminUser, // Set admin flag only for m4gistar
      bio: "", // Start with empty bio
      profileImage: "/uploads/info/defaultpfp.png" // Use default profile picture
    };

    await userStore.addUser(newUser); // Save the new user to user-store.json
    res.redirect('/login'); // Redirect to login page after successful registration
  },

  // Handles login when the user submits the login form
  async authenticate(req, res) {
    const { identifier, password } = req.body; // Get what the user typed (username or email)

    const user = await userStore.findByUsernameOrEmail(identifier); // Look for the user by username or email

    if (!user || user.password !== password) { // If no user found or password doesn't match
      return res.render('login', { error: "Invalid username/email or password" }); // Show login page with error
    }

    const isAdmin = user.admin || user.username.toLowerCase() === 'm4gistar'; // Double-check admin status

    req.session = req.session || {}; // Make sure a session object exists
    req.session.user = { // Store user data in the session so they stay logged in
      id: user.id,
      username: user.username,
      email: user.email,
      admin: isAdmin,
      bio: user.bio || "",
      profileImage: user.profileImage || "/uploads/info/defaultpfp.png"
    };

    res.redirect('/dashboard'); // Send the user to the dashboard after successful login
  },

  // Logs the user out
  logout(req, res) {
    if (req.session) req.session = null; // Destroy the session to log the user out
    res.redirect('/'); // Send them back to the homepage
  },

  // Shows the account settings page
  account(req, res) {
    if (!req.session || !req.session.user) { // If the user is not logged in
      return res.redirect('/login'); // Force them to log in first
    }
    res.render('account', { 
      title: 'My Account',
      user: req.session.user // Pass the logged-in user's data to the template
    });
  },

  // Updates the user's bio when they submit the form on the account page
  async updateBio(req, res) {
    if (!req.session || !req.session.user) return res.redirect('/login'); // Must be logged in

    const { bio } = req.body; // Get the new bio text they typed

    const user = await userStore.findByUsername(req.session.user.username); // Find the user in the database

    if (user) { // If we found the user
      user.bio = bio || ""; // Update their bio (empty string if they cleared it)
      req.session.user.bio = bio; // Also update the session so the change shows immediately
      await userStore.save(); // Save the change to user-store.json
    }

    res.redirect('/account'); // Refresh the account page
  },

  // Handles profile picture upload
  async uploadProfile(req, res) {
    if (!req.session || !req.session.user) return res.redirect('/login'); // Must be logged in

    try {
      if (req.files && req.files.profileImage) { // If they actually selected a file
        const image = req.files.profileImage; // The uploaded file object
        const username = req.session.user.username; // Get current username
        const filename = `${username}.png`; // We always save it as username.png
        const uploadPath = `./public/uploads/profiles/${filename}`; // Full path where we save it

        await image.mv(uploadPath); // Save the file to the server

        const user = await userStore.findByUsername(username); // Find the user again
        if (user) {
          user.profileImage = `/uploads/profiles/${filename}`; // Update the path in the database
          req.session.user.profileImage = user.profileImage; // Update the session too
          await userStore.save(); // Save changes to user-store.json

          // Also update the profile picture on all their private collections
          const userData = await userCollections.getAll();
          for (const col of userData) {
            if (col.ownerId === user.id) {
              col.image = user.profileImage; // So their collections show the new picture
            }
          }
          await userCollections.save(); // Save the updated collections
        }
      }
      res.redirect('/account'); // Go back to account page
    } catch (err) {
      console.error(err); // Log any error for debugging
      res.redirect('/account'); // Still go back to account page even if upload failed
    }
  },

  // Helper method used by routes.js to get total number of users for statistics
  async getAllUsers() {
    return await userStore.getAll(); // Returns the full list of users from the database
  }
};

export default accounts; // Export the object so routes.js can use all these functions