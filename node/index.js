import express from "express";
import bodyParser from "body-parser";
import { exec } from "child_process";

const path = require("path");
const fs = require("fs");

const directoryPath = path.join(__dirname, "../Effects");

let files;

fs.readdir(directoryPath, function(err, readfiles) {
  if (err) {
    console.log("Error getting directory information.");
  } else {
    files = readfiles;
  }
});

const app = express();

app.set("view engine", "pug");
app.use(bodyParser.json());

app.get("/", (req, res) => {
  let message = "Say what";
  res.render("index", { files, message });
});

app.get("/play/:sound", (req, res) => {
  let soundToPlay = directoryPath + "/" + req.params.sound;
  exec(`/usr/bin/afplay ${soundToPlay}`);
  res.send([req.params.sound, soundToPlay]);
});

app.listen(4000, () => {
  console.log(`app is listening to port 4000`);
});
