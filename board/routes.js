'use strict';

const express = require('express');
const Joi = require('joi');
const { Board, List, Card } = require('./models');

const router = express.Router();

router.get('/board', (req, res) => {
  Board.find({ user: req.user.id })
    .then(boards => res.json(boards));
});

router.get('/board/:id', (req, res, next) => {
  Board.findOne({ _id: req.params.id, user: req.user.id })
    .then(board => {
      if (!board) {
        const err = new Error('Not Found');
        err.status = 404;
        return next(err);
      } else {
        res.json(board)
      }
    });
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

  Board.create({ name: req.body.name, user: req.user.id })
    .then(board => {
      res.status(201).json(board);
    });
});

router.delete('/board/:id', (req, res) => {
  Board.findOneAndRemove({ _id: req.params.id, user: req.user.id })
    .then(board => {
      res.status(204).send();
    });
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

  Board.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, { name: req.body.name })
    .then(board => {
      if (!board) {
        const err = new Error('Board not found');
        err.status = 404;
        return next(err);
      }
      res.status(204).send();
    });
});

router.get('/board/:id/list', (req, res, next) => {
  List.find({ board: req.params.id, user: req.user.id })
    .then(lists => {
      if (!lists) {
        const err = new Error('Not Found');
        err.status = 404;
        return next(err);
      } else {
        res.json({ lists });
      }
    });
});


router.post('/board/:boardId/list', (req, res, next) => {
  const listSchema = Joi.object().keys({
    title: Joi.string().required()
  });
  const { error: validationError } = Joi.validate(req.body, listSchema);
  if (validationError) {
    const err = new Error('Bad request');
    err.status = 400;
    return next(err);
  }
  Board.findOne({ _id: req.params.boardId, user: req.user.id })
    .then(board => {
      if (!board) {
        const err = new Error('Board not found');
        err.status = 404;
        return next(err);
      }
      return List.create({ title: req.body.title, user: req.user.id, board: req.params.boardId });
    })
    .then(list => {
      return res.status(201).json(list);
    });
});

/**
 * LIST Endpoints
 */

router.get('/list/:id', (req, res, next) => {
  List.findOne({ _id: req.params.id, user: req.user.id })
    .then(list => {
      if (!list) {
        const err = new Error('List not found');
        err.status = 404;
        return next(err);
      }
      return res.json(list);
    });
});

router.delete('/list/:id', (req, res) => {
  List.findOneAndRemove({ _id: req.params.id, user: req.user.id })
    .then(list => {
      if (!list) {
        return res.status(404).send();
      }
      return res.status(204).send();
    });
});

router.put('/list/:id', (req, res, next) => {
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

  List.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, { title: req.body.title })
    .then(list => {
      if (!list) {
        const err = new Error('List not found');
        err.status = 404;
        return next(err);
      }
      return res.status(204).send();
    });
});

router.get('/list/:id/card', (req, res, next) => {
  Card.find({ list: req.params.id, user: req.user.id }).populate('cards')
    .then(cards => {
      if (!cards) {
        const err = new Error('List not found');
        err.status = 404;
        next(err);
        return;
      }
      res.json({ cards });
    });
});

router.get('/card/:id', (req, res, next) => {
  Card.findOne({ _id: req.params.id, user: req.user.id })
    .then(card => {
      if (!card) {
        const err = new Error('Card not found');
        err.status = 404;
        next(err);
      }
      res.json(card);
    });
});

router.post('/list/:id/card', (req, res, next) => {
  List.findOne({ _id: req.params.id, user: req.user.id })
    .then(list => {
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
      return Card.create({ text: req.body.text, user: req.user.id, list: req.params.id });
    })
    .then(card => {
      res.status(201).json(card);
    });
});

router.delete('/card/:id', (req, res) => {
  Card.findOneAndRemove({ _id: req.params.id, user: req.user.id })
    .then(card => {
      if (card) {
        res.status(204).send();
      } else {
        res.sendStatus(404);
      }
    });
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

  Card.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, { text: req.body.text })
    .then(card => {
      if (!card) {
        const err = new Error('Card not found');
        err.status = 404;
        return next(err);
      }
      return res.status(204).send();
    });
});

router.use(function (req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  return next(err);
});

module.exports = router;