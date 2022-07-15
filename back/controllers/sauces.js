const Sauce = require("../models/sauces");
const fs = require("fs");

// Création des sauces

exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
  delete sauceObject._userId;
  const sauce = new Sauce({
    ...sauceObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
  });

  sauce
    .save()
    .then(() => {
      res.status(201).json({ message: "Sauce saved!" });
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

// Affichage des sauces (page principale)

exports.getSauces = (req, res, next) => {
  Sauce.find()
    .then((sauces) => {
      const numberOfSauces = sauces.length;
      for (let i = 0; i < numberOfSauces; i++) {
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
  Sauce.findOne({ _id: req.params.id })
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
  const sauceObject = req.file
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
        res.status(401).json({ message: "Not authorized" });
      } else {
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
        fs.unlink(`images/${filename}`, () => {
          Sauce.deleteOne({ _id: req.params.id })
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
      case 1:
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
      case 0:
        if (sauce.usersLiked.includes(req.auth.userId)) {
          Sauce.updateOne(
            { _id: req.params.id },
            { $pull: { usersLiked: req.auth.userId }, $inc: { likes: -1 } }
          )
            .then(() => {
              res.status(200).json({ message: "Like deleted!" });
            })
            .catch((error) => res.status(400).json({ error }));
        } else if (sauce.usersDisliked.includes(req.auth.userId)) {
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
      case -1:
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
    }
  });
};
