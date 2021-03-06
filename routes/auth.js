'use strict';

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const User = require('../models/user');
const Dog = require('../models/dog');

const pictures = require('../config/pictures');

const bcryptSalt = 10;

// get users listing
router.get('/signup', (req, res, next) => {
  if (req.session.currentUser) {
    res.redirect('/dogs');
    return;
  }

  const data = {
    messages: req.flash('signup')
  };
  res.render('auth/signup', data);
});

router.post('/signup', (req, res, next) => {
  if (req.session.currentUser) {
    res.redirect('/dogs');
    return;
  }

  if (!req.body.username || !req.body.password) {
    req.flash('signup', 'username or password missing');
    res.redirect('/auth/signup');
    return;
  }

  User.findOne({username: req.body.username})
    .then((result) => {
      if (result) {
        console.log('username taken');
        req.flash('signup', 'username already taken');
        res.redirect('/auth/signup');
        return;
      }

      const salt = bcrypt.genSaltSync(bcryptSalt);
      const hashPass = bcrypt.hashSync(req.body.password, salt);

      if (!req.body.name || !req.body.age) {
        req.flash('signup', 'enter a name and age for your dog');
        res.redirect('/auth/signup');
        return;
      }
      if (!req.body.likes) {
        req.flash('signup', 'Please check off a minimun of one box about your dog');
        res.redirect('/auth/signup');
        return;
      }

      const newUser = new User({
        username: req.body.username,
        password: hashPass
      });

      const ramdomNumber = Math.floor(Math.random() * pictures.length);

      const newDog = new Dog({
        name: req.body.name,
        owner: newUser._id,
        age: req.body.age,
        likes: req.body.likes,
        picture: pictures[ramdomNumber]

      });

      newUser.save()
        .then(() => {
          newDog.save();
        })
        .then(() => {
          req.session.currentUser = newUser;
          res.redirect('/dogs');
        })
        .catch(next);
    })
    .catch(next);
});

router.get('/login', (req, res, next) => {
  if (req.session.currentUser) {
    res.redirect('/dogs');
    return;
  }

  const data = { // receives log in flash message
    messages: req.flash('login')
  };
  res.render('auth/login', data);
});

router.post('/login', (req, res, next) => {
  User.findOne({username: req.body.username})
    .then((result) => {
      if (!result) {
        req.flash('login', 'username not found');
        console.log('user not found');
        res.redirect('/auth/login');
        return;
      }
      if (!bcrypt.compareSync(req.body.password, result.password)) {
        req.flash('login', 'incorrect password');
        console.log('incorrect password');
        res.redirect('/auth/login');
        return;
      }
      req.session.currentUser = result;
      res.redirect('/dogs');
    })
    .catch(next);
});

router.post('/logout', (req, res, next) => {
  req.session.currentUser = null;
  res.redirect('/auth/login');
});

module.exports = router;
