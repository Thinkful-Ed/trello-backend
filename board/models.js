'use strict';

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// ===== Define BoardSchema & BoardModel =====
const boardSchema = new mongoose.Schema({
  name: { type: String, required: true},
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

boardSchema.set('toObject', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

const Board = mongoose.model('Board', boardSchema);


// ===== Define ListSchema & ListModel =====
const listSchema = new mongoose.Schema({
  title: { type: String, required: true},
  board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

listSchema.set('toObject', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

const List = mongoose.model('List', listSchema);


// ===== Define CardSchema & CardModel =====
const cardSchema = new mongoose.Schema({
  text: { type: String, required: true},
  list: { type: mongoose.Schema.Types.ObjectId, ref: 'List' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

cardSchema.set('toObject', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

const Card = mongoose.model('Card', cardSchema);

module.exports = { Board, List, Card }
