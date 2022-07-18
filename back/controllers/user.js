const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/user");

exports.signup = (req, res, next) => {
  bcrypt
    .hash(req.body.password, 10) /* Hachage du mot de passe */
    .then((hash) => {
      /* Création de l'utilisateur */
      const user = new User({
        email: req.body.email,
        password: hash,
      });
      /* Enregistre l'utilisateur dans la base de données */
      user
        .save()
        .then(() => res.status(201).json({ message: "User account created !" }))
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};

exports.login = (req, res, next) => {
  User.findOne({
    email: req.body.email,
  }) /* Recherche l'email saisies dans la base de données */
    .then((user) => {
      if (!user) {
        return res.status(401).json({ error: "User not found !" });
      }
      /* Vérifie le mot de pasee */
      bcrypt
        .compare(req.body.password, user.password)
        .then((valid) => {
          if (!valid) {
            return res.status(401).json({ error: "Wrong password !" });
          }
          res.status(200).json({
            userId: user._id,
            /* Attriube un token pour 24h */
            token: jwt.sign({ userId: user._id }, "RANDOM_TOKEN_SECRET", {
              expiresIn: "24h",
            }),
          });
        })
        .catch((error) => res.status(500).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};
