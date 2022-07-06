const express = require("express");

const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

app.use(express.json());

module.exports = app;

const mongoose = require("mongoose");

mongoose
  .connect(
    "mongodb+srv://FlorianRiviere:4r7CY8riOlq6wSZb@cluster0.ftbrp.mongodb.net/?retryWrites=true&w=majority"
  )
  .then(() => {
    console.log("connexion success");
  })
  .catch((error) => {
    console.log(error);
  });
