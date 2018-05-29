'use strict';

const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');
const Joi = require('joi');
const uuid = require('uuid');

const { SERVER_PORT } = require('./config');
const boardsFixture = require('./boards');

const app = express();

app.use(cors());
app.use(bodyParser.json());

function makeBoard(name, lists = []) {
  return {
    name,
    id: uuid.v4(),
    lists
  };
}

function makeList(title, cards = []) {
  return {
    title,
    cards,
    id: uuid.v4()
  };
}

function makeCard(text) {
  return {
    text,
    id: uuid.v4()
  };
}


let BOARDS = boardsFixture;

app.get('/api/board', (req, res) => res.json({ boards: BOARDS }));

app.get('/api/board/:id', (req, res, next) => {
  const board = BOARDS.find(item => item.id === req.params.id);
  if (!board) {
    const err = new Error('Not Found');
    err.status = 404;
    return next(err);
  }
  return res.json(board);
});

app.post('/api/board', (req, res, next) => {
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
  const board = makeBoard(req.body.name);
  BOARDS.push(board);
  return res.status(201).json(board);
});

app.delete('/api/board/:id', (req, res) => {
  BOARDS = BOARDS.filter(board => board.id !== req.params.id);
  return res.status(204).send();
});

app.put('/api/board/:id', (req, res, next) => {
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
  const board = BOARDS.find(item => item.id === req.params.id);
  if (!board) {
    const err = new Error('Board not found');
    err.status = 404;
    return next(err);  
  }
  board.name = req.body.name;
  return res.status(204).send();
});

app.get('/api/board/:id/list', (req, res, next) => {
  const board = BOARDS.find(item => item.id === req.params.id);
  if (!board) {
    const err = new Error('Not found');
    err.status = 404;
    return next(err);  
  }
  return res.json({ lists: board.lists });
});

function findList(listId, boards = BOARDS) {
  let list = null;
  for (let board of boards) {
    list = board.lists.find(list => list.id === listId);
    if (list) {
      break;
    }
  }
  return list;
}

app.get('/api/list/:id', (req, res, next) => {
  const list = findList(req.params.id);
  if (!list) {
    const err = new Error('List not found');
    err.status = 404;
    return next(err);  
  }
  return res.json(list);
});

app.post('/api/board/:boardId/list', (req, res, next) => {
  const board = BOARDS.find(item => item.id === req.params.boardId);
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
  const list = makeList(req.body.title);
  board.lists.push(list);
  return res.status(201).json(list);
});

app.delete('/api/list/:id', (req, res) => {
  for (let board of BOARDS) {
    const listIndex = board.lists.findIndex(list => list.id === req.params.id);
    if (listIndex >= 0) {
      board.lists.splice(listIndex, 1);
      break;
    }
  }
  return res.status(204).send();
});

app.put('/api/list/:id', (req, res, next) => {
  const list = findList(req.params.id);
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

app.get('/api/list/:id/card', (req, res, next) => {
  const list = findList(req.params.id);
  if (!list) {
    const err = new Error('List not found');
    err.status = 404;
    next(err);
  }
  res.json({ cards: list.cards });
});

function getCard(cardId, boards = BOARDS) {
  let card = null;
  for (let board of boards) {
    for (let list of board.lists) {
      card = list.cards.find(card => card.id === cardId);
      if (card) {
        break;
      }
    }
  }
  return card;
}

app.get('/api/card/:id', (req, res, next) => {
  const card = getCard(req.params.id);
  if (!card) {
    const err = new Error('Card not found');
    err.status = 404;
    next(err);
  }
  res.json(card);
});

app.post('/api/list/:id/card', (req, res, next) => {
  const list = findList(req.params.id);
  if (!list) {
    const err = new Error('List not found');
    err.status = 404;
    next(err);
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
  const card = makeCard(req.body.text);
  list.cards.push(card);
  res.status(201).json(card);
});

app.delete('/api/card/:id', (req, res) => {
  for (let board of BOARDS) {
    for (let list of board.lists) {
      const cardIndex = list.cards.findIndex(card => card.id === req.params.id);
      if (cardIndex) {
        list.cards.splice(cardIndex, 1);
        break;
      }
    }
  }
  res.status(204).send();
});

app.put('/api/card/:id', (req, res, next) => {
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
  const card = getCard(req.params.id);
  if (!card) {
    const err = new Error('Card not found');
    err.status = 404;
    return next(err);
  }
  card.text = req.body.text;
  return res.status(204).send();
});

app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  return next(err);
});

// Catch-all Error handler
// Add NODE_ENV check to prevent stacktrace leak
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  return res.json({
    message: err.message,
    error: app.get('env') === 'development' ? err : {}
  });
});


app.listen(SERVER_PORT, () =>
  console.log(`Your app is listening on port ${SERVER_PORT}`)
);
