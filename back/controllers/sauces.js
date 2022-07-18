const Sauce = require("../models/sauces");
const fs = require("fs");

// Création des sauces

exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(
    req.body.sauce
  ); /* Récupère les informations saisies par l'utilisateur */
  delete sauceObject._id; /* Supprime les informations renvoyées par le front */
  delete sauceObject._userId;
  /* Crée l'objet à envoyer dans la base de données */
  const sauce = new Sauce({
    ...sauceObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
  });

  sauce
    .save() /* Envoie la sauce dans la base de données */
    .then(() => {
      res.status(201).json({ message: "Sauce saved!" });
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

// Affichage des sauces (page principale)

exports.getSauces = (req, res, next) => {
  Sauce.find() /* Récupère les sauces dans la base de données */
    .then((sauces) => {
      const numberOfSauces = sauces.length;
      for (let i = 0; i < numberOfSauces; i++) {
        /* Attribue une image par défaut si l'image attribuée n'est pas trouvée */
        const filename = sauces[i].imageUrl.split("/images/")[1];
        if (fs.existsSync(`images/${filename}`)) {
        } else {
          sauces[i].imageUrl = `${req.protocol}://${req.get(
            "host"
          )}/public/default-image.jpg`;
        }
      }
      res.status(200).json(sauces);
    })
    .catch((error) => res.status(400).json({ error }));
};

// Affichage d'une seule sauce (page sauce)

exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({
    _id: req.params.id,
  }) /* Récupère une sauce dans la base de données selon l'ID de la sauce dans l'URL */
    .then((sauces) => {
      const filename = sauces.imageUrl.split("/images/")[1];
      if (fs.existsSync(`images/${filename}`)) {
      } else {
        sauces.imageUrl = `${req.protocol}://${req.get(
          "host"
        )}/public/default-image.jpg`;
      }
      res.status(200).json(sauces);
    })
    .catch((error) => res.status(400).json({ error }));
};

// Modification des sauces

exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file /* Vérifie s' il y a une nouvelle image */
    ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };

  delete sauceObject._userId;
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      if (sauce.userId != req.auth.userId) {
        /* Vérifie si c'est bien le créateur de la sauce */
        res.status(401).json({ message: "Not authorized" });
      } else if (sauceObject.imageUrl == undefined) {
        Sauce.updateOne(
          /* Met à jour la sauce dans la base de données */
          { _id: req.params.id },
          { ...sauceObject, _id: req.params.id }
        )
          .then(() => res.status(200).json({ message: "Sauce modified!" }))
          .catch((error) => res.status(401).json({ error }));
      } else {
        /* Si l'image est modifiée alors l'ancienne est supprimée */
        const filename = sauce.imageUrl.split("/images/")[1];
        fs.unlink(`images/${filename}`, () => {
          Sauce.updateOne(
            { _id: req.params.id },
            { ...sauceObject, _id: req.params.id }
          )
            .then(() => res.status(200).json({ message: "Sauce modified!" }))
            .catch((error) => res.status(401).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

// Suppression des sauces

exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      if (sauce.userId != req.auth.userId) {
        res.status(401).json({ message: "Not authorized" });
      } else {
        const filename = sauce.imageUrl.split("/images/")[1];
        // Supprime l'image
        fs.unlink(`images/${filename}`, () => {
          Sauce.deleteOne({
            _id: req.params.id,
          }) /* Supprime la sauce dans la base de données */
            .then(() => {
              res.status(200).json({ message: "Sauce deleted!" });
            })
            .catch((error) => res.status(401).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

// Gestion des likes

exports.likeSauce = (req, res, next) => {
  const like = req.body.like;

  Sauce.findOne({ _id: req.params.id }).then((sauce) => {
    switch (like) {
      case 1 /* En cas de like */:
        // Vérifie que l'utilisateur n'a pas déjà like la sauce
        if (!sauce.usersLiked.includes(req.auth.userId)) {
          Sauce.updateOne(
            { _id: req.params.id },
            { $push: { usersLiked: req.auth.userId }, $inc: { likes: +1 } }
          )
            .then(() => {
              res.status(200).json({ message: "Sauce liked!" });
            })
            .catch((error) => res.status(400).json({ error }));
        }

        break;
      case -1 /* En cas de dislike */:
        // Vérifie que l'utilisateur n'a pas déjà dislike la sauce
        if (!sauce.usersDisliked.includes(req.auth.userId)) {
          {
            Sauce.updateOne(
              { _id: req.params.id },
              {
                $push: { usersDisliked: req.auth.userId },
                $inc: { dislikes: +1 },
              }
            )
              .then(() => {
                res.status(200).json({ message: "Sauce disliked!" });
              })
              .catch((error) => res.status(400).json({ error }));
          }
        }
        break;
      case 0 /* Au cas où le like ou le dislike est enlevé */:
        // Vérifie si l'utilisateur a like la sauce
        if (sauce.usersLiked.includes(req.auth.userId)) {
          Sauce.updateOne(
            { _id: req.params.id },
            { $pull: { usersLiked: req.auth.userId }, $inc: { likes: -1 } }
          )
            .then(() => {
              res.status(200).json({ message: "Like deleted!" });
            })
            .catch((error) => res.status(400).json({ error }));
        }
        // Vérifie si l'utilisateur a dislike la sauce
        else if (sauce.usersDisliked.includes(req.auth.userId)) {
          Sauce.updateOne(
            { _id: req.params.id },
            {
              $pull: { usersDisliked: req.auth.userId },
              $inc: { dislikes: -1 },
            }
          )
            .then(() => {
              res.status(200).json({ message: "Dislike deleted!" });
            })
            .catch((error) => res.status(400).json({ error }));
        }
        break;
    }
  });
};
