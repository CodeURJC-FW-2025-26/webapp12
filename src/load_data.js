import fs from 'node:fs/promises';
import * as videogame from './videogame.js';

const UPLOADS_FOLDER = './uploads';
const DATA_FOLDER = './data';

let dataFile = 'data.json';

const dataString = await fs.readFile(DATA_FOLDER + '/' + dataFile, 'utf8');

const posts = JSON.parse(dataString);

await videogame.deleteVideogames();
for(let post of posts){
    await videogame.addVideogame(post);
}

await fs.rm(UPLOADS_FOLDER, { recursive: true, force: true });
await fs.mkdir(UPLOADS_FOLDER);
await fs.cp(DATA_FOLDER + '/images', UPLOADS_FOLDER, { recursive: true });

console.log('Demo data loaded');