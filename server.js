const express = require('express');
const cors = require('cors');
const Joi = require('joi');
const uuid = require('uuid');

const {CLIENT_ORIGIN} = require('./config');

const app = express();

app.use(
    cors({
        origin: CLIENT_ORIGIN
    })
);


function makeBoard(name, lists=[]) {
    return {
        name,
        id: uuid.v4(),
        lists
    };
}

function makeList(title, cards=[]) {
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


function makeStarterBoard(){
    cards = [
        makeCard('Example card 1'),
        makeCard('Example card 2'),
        makeCard('Example card 3'),
        makeCard('Example card 4'),
    ];

    const lists = [
        makeList('Example list 1', cards.slice(0, 2)),
        makeList('Example list 2', cards.slice(2, 4))
    ];

    return makeBoard('Example board 1', lists);
}

const BOARDS = [makeStarterBoard(), ];


app.get('/api/board', (req, res) => res.json({'boards': BOARDS}));

app.get('/api/board/:id', (req, res) => {
    const board = BOARDS.find(item => item.id === req.params.id);
    if (!board) {
        return res.status(404).send('Not found');
    }
    return res.json(board);
});


app.post('/api/board', (req, res) => {
    const boardSchema = Joi.object().keys({
        name: Joi.string().min(1).required()
    });
    const {error} = Joi.validate(req.body, boardSchema);
    if (error) {
        return res.status(400).send('Bad request');
    }
    const board = makeBoard(req.body.name);
    BOARDS.push(board);
    return res.status(201).json(board);
});

app.delete('/api/board/:id', (req, res) => {
    BOARDS = BOARDS.filter(board => board.id !== req.params.id);
    return res.status(204).send();
});

app.put('/api/board/:id', (req, res) => {
    const boardSchema = Joi.object().keys({
        name: Joi.string().required(),
        id: Joi.string().required()
    });
    const {error} = Joi.validate(req.body, boardSchema);
    if (error) {
        return res.status(400).send('Bad request');
    }
    if (req.params.id !== req.body.id) {
        const message = `Request path id (${req.params.id}) and request body id (${req.body.id}) must match`;
        return res.status(400).send(message);
    }
    const board = BOARDS.find(item => item.id === req.params.id);
    if (!board) {
        const message = 'Board not found';
        return res.status(404).send(message);
    }
    board.name = req.params.id;
    return res.status(204).send(); 
});


app.get('/api/board/:id/list', (req, res) => {
    const board = BOARDS.find(item => item.id === req.params.id);
    if (!board) {
        return res.status(404).send('Not found');
    }
    return res.json({'lists': board.lists});
});

app.get('/api/board/:boardId/list/:listId', (req, res) => {
    const board = BOARDS.find(item => item.id === req.params.boardId);
    if (!board) {
        return res.status(404).send('Board not found');
    }
    const list = board.lists.find(list => list.id === req.params.listId);
    if (!list) {
        return res.status(404).send('List not found');
    }
    return res.json(list);
});


app.post('/api/board/:boardId/list', (req, res) => {
    const board = BOARDS.find(item => item.id === req.params.boardId);
    if (!board) {
        return res.status(404).send('Board not found');
    }
    const listSchema = Joi.object().keys({
        title: Joi.string().required(),
    });
    const {error} = Joi.validate(req.body, listSchema);
    if (error) {
        return res.status(400).send('Bad request');
    }
    const list = makeList(req.params.title);
    board.lists.push(list);
    return res.status(201).json(list);
});


app.delete('/api/board/:boardId/list/:listId', (req, res) => {
    const board = BOARDS.find(item => item.id === req.params.boardId);
    if (!board) {
        return res.status(404).send('Board not found');
    }
    board.lists = board.lists.filter(list => list.id !== req.params.listId);
    return res.status(204).send();
});


app.put('/api/board/:boardId/list/:listId', (req, res) => {
    const board = BOARDS.find(item => item.id === req.params.boardId);
    if (!board) {
        return res.status(404).send('Board not found');
    }
    const listSchema = Joi.object().keys({
        title: Joi.string().required(),
        id: Joi.string().required()
    });
    const {error} = Joi.validate(req.body, listSchema);
    if (error) {
        return res.status(400).send('Bad request');
    }
    if (req.params.listId !== req.body.listId) {
        const message = `Request path listId (${req.params.id}) and request body id (${req.body.id}) must match`;
        return res.status(400).send(message);
    }
    const list = board.lists.find(item => item.id === req.params.id);
    if (!list) {
        const message = 'List not found';
        return res.status(404).send(message);
    }
    list.name = req.params.id;
    return res.status(204).send();
});


// get cards for list
// get card by id
// post card
// delete card
// update card

app.listen(8080);
