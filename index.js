// dotenv loads parameters (port and database config) from .env
require('dotenv').config();
const express = require('express');
const connection = require('./db');
const app = express();

app.use(express.json());

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

// ajout d'un user avec vérifications manuelles des champs
// app.post('/api/users', (req, res) => {
//   const dataUser = req.body;

//   const { email, password, name } = req.body;
//   if(!email || !password || !name){
//     return res.status(422).json({
//       error: 'Missing at least one of the required fields is missing'
//     });
//   }

//   const emailRegex = /[a-z0-9._-]+@[a-z0-9-]+\.[a-z]{2,6}/;
//   // si l'email ne passe pas le test de la regex, l'erreur est affichée
//   if(!emailRegex.test(email)){
//     return  res.status(422).json({
//       error: 'Invalid email',
//     })
//   }

//   const passwordRegex = /^((?=.*[@#!$&+%/*])(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).{8,})$/;
//   if(!passwordRegex.test(password)){
//     return res.status(422).json({
//       error: 'Password too short (8 characters min.) !',
//     })
//   }

//   connection.query('INSERT INTO user SET ?', dataUser, (err, results) => {
//     if(err){
//       console.log(err)
//       res.status(500).json({
//         error: err.message,
//         sql: err.sql,
//       });
//     }
//     else{
//       res.json(results);
//     }
//   })
// });

// make validations on the inputs
// const { check, validationResult } = require('express-validator');

// // ajout d'un user avec vérifications des champs par le module "express-validator"
// // ce module utilise le système de "middlewares" en rajoutant des propriétés à "req"
// app.post('/api/users', [
//   check('email').isEmail(),
//   check('password').isLength({ min: 8 }),
//   check('name').isLength({ min: 4 })
// ], (req, res) => {

//   // Finds the validation errors in this request and wraps them in an object with handy functions
//   const errors = validationResult(req);
//   if(!errors.isEmpty()){
//     return res.status(422).json({ errors: errors.array() });
//   }
  
//   const dataUser = req.body;
//   connection.query('INSERT INTO user SET ?', dataUser, (err, results) => {
//     if(err){
        // if(err.code === 'ER_DUP-ENTRY'){
        //   res.status(409).json({
        //     error: 'Email already exists'
        //   });
        // }
//
//       console.log(err)
//       res.status(500).json({
//         error: err.message,
//         sql: err.sql,
//       });
//     }
//     else{
//       // if everything ok we want to return a custom response to the user
//       connection.query('SELECT * FROM user WHERE id = ?', results.insertId, (err2, records) => {
//         if(err2){
//           res.status(500).json({
//             error: err2.message,
//             sql: err2.sql,
//           });
//         }
//         else{
//           // we enter in the first item of the array
//           const insertUser = records[0];
//           // we destructure the entire user, exept the password, as a new object
//           const { password, ...user } = insertUser;
//           // we get the 'host' and the 'port'
//           const host = req.get('host');
//           // we create the full location (ex: http://localhost:3000/api/users/:id)
//           const location = `http://${host}${req.url}/${user.id}`;
//           res.status(201).set('Location', location).json(user);
//         }
//       });
//     }
//   });
// });

app.put('/api/users/:id', (req, res) => {
  // VALIDATION PART //
  const { email, password, name } = req.body;
  if(!email || !password || !name){
    return res.status(422).json({
      error: 'Missing at least one of the required fields is missing'
    });
  };

  const emailRegex = /[a-z0-9._-]+@[a-z0-9-]+\.[a-z]{2,6}/;
  // si l'email ne passe pas le test de la regex, l'erreur est affichée
  if(!emailRegex.test(email)){
    return  res.status(422).json({
      error: 'Invalid email',
    });
  };

  const passwordRegex = /^((?=.*[@#!$&+%/*])(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).{8,})$/;
  if(!passwordRegex.test(password)){
    return res.status(422).json({
      error: 'Password too short (8 characters min.) !',
    });
  };
  
  // UPDATE USER PART //
  const idUser = req.params.id;
  const dataUser = req.body;

  connection.query('UPDATE user SET ? WHERE id = ?', [dataUser, idUser], (err, results) => {
    if(err){
      // si l'utilisateur rentre un email déjà existant en base de données, sql le sait et retourne
      // l'erreur de dupplication de l'entrée, si cette erreur est présente, on retourne une erreur
      // à l'utilisateur en lui spécifiant que cet email existe déjà
      if(err.code === 'ER_DUP-ENTRY'){
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
      // if everything ok we want to return a custom response to the user
      connection.query('SELECT * FROM user WHERE id = ?', [idUser], (err2, records) => {
        if(err2){
          res.status(500).json({
            error: err2.message,
            sql: err2.sql,
          });
        }
        else{
          // we enter in the first item of the array
          const updateUser = records[0];
          // we destructure the entire user, exept the password, as a new object
          const { password, ...user } = updateUser;
          // we get the 'host' and the 'port'
          const host = req.get('host');
          // we create the full location (ex: http://localhost:3000/api/users/:id)
          const location = `http://${host}${req.url}/${user.id}`;
          res.status(201).set('Location', location).json(user);
        }
      });
    }
  })
})

app.listen(process.env.PORT, (err) => {
  if (err) {
    throw new Error('Something bad happened...');
  }

  console.log(`Server is listening on ${process.env.PORT}`);
});
