'use strict';

require('dotenv').config();

const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');

const { PORT } = require('./config');
const app = express();
const boardMiddleware = require('./board/routes');
const userMiddleware = require('./user/routes');
const jwtAuth = require("./middleware/jwt-auth");
const authMiddleware = require('./user/auth');
const db = require('./middleware/mongoose');

app.use(cors());
app.use(bodyParser.json());


app.use('/api/users', userMiddleware);
app.use('/api', authMiddleware);
app.use('/api', jwtAuth, boardMiddleware);


app.use(function (req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  return next(err);
});

// Custom 404 Not Found route handler
app.use((req, res, next) => {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// Custom Error Handler
app.use((err, req, res, next) => {
  if (err.status) {
    const errBody = Object.assign({}, err, { message: err.message });
    res.status(err.status).json(errBody);
  } else {
    res.status(500).json({ message: "Internal Server Error" });
    console.error(err);
  }
});

if (process.env.NODE_ENV !== 'test') {
  db.connect();
  app.listen(PORT, () =>

    console.log(`Your app is listening on port ${PORT}`)
  );
}
