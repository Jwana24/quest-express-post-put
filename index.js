// dotenv loads parameters (port and database config) from .env
require('dotenv').config();
const express = require('express');
const connection = require('./db');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const { check, validationResult } = require('express-validator');

// respond to requests on `/api/users`
app.get('/api/users', (req, res) => {
  // send an SQL query to get all users
  connection.query('SELECT * FROM user', (err, results) => {
    if (err) {
      // If an error has occurred, then the client is informed of the error
      res.status(500).json({
        error: err.message,
        sql: err.sql,
      });
    } else {
      // If everything went well, we send the result of the SQL query as JSON
      res.json(results);
    }
  });
});

const userValidationMiddlewares = [
  // email must be valid
  check('email').isEmail(),
  // password must be at least 8 chars long
  check('password').isLength({ min: 8 }),
  // let's assume a name should be 2 chars long
  check('name').isLength({ min: 2 }),
];

app.put('/api/users/:id', userValidationMiddlewares, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  };

  const dataUser = req.body;
  const idUser = req.params.id;

  connection.query('UPDATE user SET ? WHERE id = ?', [dataUser, idUser], (err, results) => {
    if(err){
      if(err.code === "ER_DUP_ENTRY"){
        res.status(409).json({
          error: 'Email already exists'
        });
      }
      console.log(err);
      res.status(500).json({
        error: err.message,
        sql: err.sql,
      });
    }
    else{
      connection.query('SELECT * FROM user WHERE id = ?', [idUser], (err2, records) => {
        if(err2){
          return res.status(500).json({
            error: err2.message,
            sql: err2.sql,
          });
        }
        else{
          const updatedUser = records[0];
          const { password, ...user } = updatedUser;
          const host = req.get('host');
          const location = `http://${host}${req.url}/${user.id}`;
          res.status(200).set('Location', location).json(user);
        }
      });
    }
  });
});

app.listen(process.env.PORT, (err) => {
  if (err) {
    throw new Error('Something bad happened...');
  }

  console.log(`Server is listening on ${process.env.PORT}`);
});
