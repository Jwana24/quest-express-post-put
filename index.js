// dotenv loads parameters (port and database config) from .env
require('dotenv').config();
const express = require('express');
const connection = require('./db');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

app.post('/api/users', (req, res) => {
  const dataUser = req.body;

  const { email, password, name } = req.body;
  if(!email || !password || !name){
    return res.status(422).json({
      error: 'Missing at least one of the required fields is missing'
    });
  }

  const emailRegex = /[a-z0-9._-]+@[a-z0-9-]+\.[a-z]{2,6}/;
  // si l'email ne passe pas le test de la regex, l'erreur est affichée
  if(!emailRegex.test(email)){
    return  res.status(422).json({
      error: 'Invalid email',
    })
  }

  const passwordRegex = /^((?=.*[@#!$&+%/*])(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).{8,})$/;
  if(!passwordRegex.test(password)){
    return res.status(422).json({
      error: 'Password too short (8 characters min.) !',
    })
  }

  connection.query('INSERT INTO user SET ?', dataUser, (err, results) => {
    if(err){
      console.log(err)
      res.status(500).json({
        error: err.message,
        sql: err.sql,
      });
    }
    else{
      res.json(results);
    }
  })
});

app.listen(process.env.PORT, (err) => {
  if (err) {
    throw new Error('Something bad happened...');
  }

  console.log(`Server is listening on ${process.env.PORT}`);
});
