'use strict';

const express = require('express');
const Joi = require('joi');
const uuid = require('uuid');
const boardsFixture = require('./boards');

const router = express.Router();

function makeBoard(name, userId, lists = []) {
  return {
    name,
    userId,
    id: uuid.v4(),
    lists
  };
}

function makeList(title, userId, cards = []) {
  return {
    title,
    userId,
    cards,
    id: uuid.v4()
  };
}

function makeCard(text, userId) {
  return {
    text,
    userId,
    id: uuid.v4()
  };
}


let BOARDS = boardsFixture;

router.get('/board', (req, res) => {
  res.json({ boards: BOARDS.filter(board => board.userId === req.user.id) })
});

router.get('/board/:id', (req, res, next) => {
  const board = BOARDS.find(item => item.id === req.params.id && item.userId === req.user.id);
  if (!board) {
    const err = new Error('Not Found');
    err.status = 404;
    return next(err);
  }
  return res.json(board);
});

router.post('/board', (req, res, next) => {
  const boardSchema = Joi.object().keys({
    name: Joi.string()
      .min(1)
      .required()
  });
  const { error: validationError } = Joi.validate(req.body, boardSchema);
  if (validationError) {
    const err = new Error('Bad request');
    err.status = 400;
    return next(err);
  }
  const board = makeBoard(req.body.name, req.user.id);
  BOARDS.push(board);
  return res.status(201).json(board);
});

router.delete('/board/:id', (req, res) => {
  BOARDS = BOARDS.filter(board => board.id !== req.params.id && board.userId === req.user.id);
  return res.status(204).send();
});

router.put('/board/:id', (req, res, next) => {
  const boardSchema = Joi.object().keys({
    name: Joi.string().required(),
    id: Joi.string().required()
  });
  const { error: validationError } = Joi.validate(req.body, boardSchema);
  if (validationError) {
    const err = new Error('Bad request');
    err.status = 400;
    return next(err);
  }
  if (req.params.id !== req.body.id) {
    const err = new Error(`Request path id (${req.params.id}) and request body id (${
      req.body.id}) must match`);
    err.status = 400;
    return next(err);
  }
  const board = BOARDS.find(item => item.id === req.params.id && item.userId === req.user.id);
  if (!board) {
    const err = new Error('Board not found');
    err.status = 404;
    return next(err);
  }
  board.name = req.body.name;
  return res.status(204).send();
});

router.get('/board/:id/list', (req, res, next) => {
  const board = BOARDS.find(item => item.id === req.params.id && item.userId === req.user.id);
  if (!board) {
    const err = new Error('Not found');
    err.status = 404;
    return next(err);
  }
  return res.json({ lists: board.lists });
});

function findList(listId, userId, boards = BOARDS) {
  let list = null;
  for (let board of boards) {
    list = board.lists.find(list => list.id === listId && list.userId === userId);
    if (list) {
      break;
    }
  }
  return list;
}

router.get('/list/:id', (req, res, next) => {
  const list = findList(req.params.id, req.user.id);
  if (!list) {
    const err = new Error('List not found');
    err.status = 404;
    return next(err);
  }
  return res.json(list);
});

router.post('/board/:boardId/list', (req, res, next) => {
  const board = BOARDS.find(item => item.id === req.params.boardId && item.userId === req.user.id);
  if (!board) {
    const err = new Error('Board not found');
    err.status = 404;
    return next(err);
  }
  const listSchema = Joi.object().keys({
    title: Joi.string().required()
  });
  const { error: validationError } = Joi.validate(req.body, listSchema);
  if (validationError) {
    const err = new Error('Bad request');
    err.status = 400;
    return next(err);
  }
  const list = makeList(req.body.title, req.user.id);
  board.lists.push(list);
  return res.status(201).json(list);
});

router.delete('/list/:id', (req, res) => {
  for (let board of BOARDS) {
    const listIndex = board.lists.findIndex(list => list.id === req.params.id && list.userId === req.user.id);
    if (listIndex >= 0) {
      board.lists.splice(listIndex, 1);
      break;
    }
  }
  return res.status(204).send();
});

router.put('/list/:id', (req, res, next) => {
  const list = findList(req.params.id, req.user.id);
  if (!list) {
    const err = new Error('List not found');
    err.status = 404;
    return next(err);
  }
  const listSchema = Joi.object().keys({
    title: Joi.string().required(),
    id: Joi.string().required()
  });
  const { error: validationError } = Joi.validate(req.body, listSchema);
  if (validationError) {
    const err = new Error('Bad request');
    err.status = 400;
    return next(err);
  }
  if (req.params.id !== req.body.id) {
    const message = `Request path id (${req.params.id}) and request body id (${
      req.body.id
      }) must match`;
    const err = new Error(message);
    err.status = 400;
    return next(err);
  }
  list.title = req.body.title;
  return res.status(204).send();
});

router.get('/list/:id/card', (req, res, next) => {
  const list = findList(req.params.id, req.user.id);
  if (!list) {
    const err = new Error('List not found');
    err.status = 404;
    next(err);
    return;
  }
  res.json({ cards: list.cards });
});

function getCard(cardId, userId, boards = BOARDS) {
  let card = null;
  for (let board of boards) {
    for (let list of board.lists) {
      card = list.cards.find(card => card.id === cardId && card.userId === userId);
      if (card) {
        break;
      }
    }
  }
  return card;
}

router.get('/card/:id', (req, res, next) => {
  const card = getCard(req.params.id, req.user.id);
  if (!card) {
    const err = new Error('Card not found');
    err.status = 404;
    next(err);
  }
  res.json(card);
});

router.post('/list/:id/card', (req, res, next) => {
  const list = findList(req.params.id, req.user.id);
  if (!list) {
    const err = new Error('List not found');
    err.status = 404;
    next(err);
    return;
  }
  const cardSchema = Joi.object().keys({
    text: Joi.string().required()
  });
  const { error: validationError } = Joi.validate(req.body, cardSchema);
  if (validationError) {
    const err = new Error('Bad request');
    err.status = 400;
    next(err);
  }
  const card = makeCard(req.body.text, req.user.id);
  list.cards.push(card);
  res.status(201).json(card);
});

router.delete('/card/:id', (req, res) => {
  let cardFound = false;
  for (let board of BOARDS) {
    let index = 0;
    for (let list of board.lists) {
      const newlist = list.cards.filter(card => card.id === req.params.id && card.userId === req.user.id);
      if (newlist.length < list.cards.length) {
        list.cards = newlist;
        cardFound = true;
        break;
      }
      index++;
    }
  }
  if (cardFound) {
    res.status(204).send();
  } else {
    res.sendStatus(404);
  }
});

router.put('/card/:id', (req, res, next) => {
  const cardSchema = Joi.object().keys({
    text: Joi.string().required(),
    id: Joi.string().required()
  });
  const { error: validationError } = Joi.validate(req.body, cardSchema);
  if (validationError) {
    const err = new Error('Bad request');
    err.status = 400;
    return next(err);
  }
  if (req.params.id !== req.body.id) {
    const message = `Request path id (${req.params.id}) and request body id (${
      req.body.id
      }) must match`;

    const err = new Error(message);
    err.status = 400;
    return next(err);
  }
  const card = getCard(req.params.id, req.user.id);
  if (!card) {
    const err = new Error('Card not found');
    err.status = 404;
    return next(err);
  }
  card.text = req.body.text;
  return res.status(204).send();
});

router.use(function (req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  return next(err);
});

module.exports = router;