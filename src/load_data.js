import fs from "node:fs/promises";
import * as videogame from "./videogame.js";
import { ObjectId } from 'mongodb';

const UPLOADS_FOLDER = "./uploads";
const DATA_FOLDER = "./data";

let dataFile = "data.json";

const dataString = await fs.readFile(DATA_FOLDER + "/" + dataFile, "utf8");

const games = JSON.parse(dataString);

// Add id to each comment
for (let game of games) {
  if (game.comments && Array.isArray(game.comments)) {
    game.comments = game.comments.map((comment) => ({
      _id: new ObjectId(),
      ...comment,
    }));
  }
}

await videogame.deleteVideogames();
for (let game of games) {
  await videogame.addVideogame(game);
}

await fs.rm(UPLOADS_FOLDER, { recursive: true, force: true });
await fs.mkdir(UPLOADS_FOLDER);
await fs.cp(DATA_FOLDER + "/images", UPLOADS_FOLDER, { recursive: true });

console.log("Demo data loaded");
