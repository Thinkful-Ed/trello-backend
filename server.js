const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');
const Joi = require('joi');
const uuid = require('uuid');

const { CLIENT_ORIGIN, SERVER_PORT } = require('./config');

const app = express();

app.use(
    cors({
        origin: CLIENT_ORIGIN
    })
);

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


function makeStarterBoard() {
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

let BOARDS = [makeStarterBoard(),];


app.get('/api/board', (req, res) => res.json({ 'boards': BOARDS }));

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
    const { error } = Joi.validate(req.body, boardSchema);
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
    const { error } = Joi.validate(req.body, boardSchema);
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
    board.name = req.params.name;
    return res.status(204).send();
});


app.get('/api/board/:id/list', (req, res) => {
    const board = BOARDS.find(item => item.id === req.params.id);
    if (!board) {
        return res.status(404).send('Not found');
    }
    return res.json({ 'lists': board.lists });
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


app.get('/api/list/:id', (req, res) => {
    const list = findList(req.params.id);
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
    const { error } = Joi.validate(req.body, listSchema);
    if (error) {
        return res.status(400).send('Bad request');
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


app.put('/api/list/:id', (req, res) => {
    const list = findList(req.params.id);
    if (!list) {
        return res.status(404).send('List not found');
    }
    const listSchema = Joi.object().keys({
        title: Joi.string().required(),
        id: Joi.string().required()
    });
    const { error } = Joi.validate(req.body, listSchema);
    if (error) {
        return res.status(400).send('Bad request');
    }
    if (req.params.id !== req.body.id) {
        const message = `Request path id (${req.params.id}) and request body id (${req.body.id}) must match`;
        return res.status(400).send(message);
    }
    list.name = req.params.id;
    return res.status(204).send();
});

app.get('/api/list/:id/card', (req, res) => {
    const list = findList(req.params.id);
    if (!list) {
        return res.status(404).send('List not found');
    }
    return res.json({ 'cards': list.cards });
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

app.get('/api/card/:id', (req, res) => {
    const card = getCard(req.params.id);
    if (!card) {
        return res.status(404).send('Card not found');
    }
    return res.json(card);
});


app.post('/api/list/:id/card', (req, res) => {
    const list = findList(req.params.id);
    if (!list) {
        return res.status(404).send('List not found');
    }
    const cardSchema = Joi.object().keys({
        text: Joi.string().required(),
    });
    const { error } = Joi.validate(req.body, cardSchema);
    if (error) {
        return res.status(400).send('Bad request');
    }
    const card = makeCard(req.body.text);
    list.cards.push(card);
    return res.status(201).json(card);
});


app.delete('/api/card/:id', (req, res) => {
    for (let board of BOARDS) {
        for (let list of board.lists) {
            cardIndex = list.cards.findIndex(card => card.id === req.params.id);
            if (cardIndex) {
                list.cards.splice(cardIndex, 1);
                break;
            }
        }
    }
    return res.status(204).send();
});


app.put('/api/card/:id', (req, res) => {
    const cardSchema = Joi.object().keys({
        text: Joi.string().required(),
        id: Joi.string().required(),
    });
    const { error } = Joi.validate(req.body, cardSchema);
    if (error) {
        return res.status(400).send('Bad request');
    }
    if (req.params.id !== req.body.id) {
        const message = `Request path id (${req.params.id}) and request body id (${req.body.id}) must match`;
        return res.status(400).send(message);
    }
    const card = getCard(req.params.id);
    if (!card) {
        return res.status(404).send('Card not found');
    }
    card.text = req.params.text;
    return res.status(204).send();
});


app.listen(SERVER_PORT, () => console.log(
    `Your app is listening on port ${SERVER_PORT}`));
