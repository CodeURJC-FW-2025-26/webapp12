import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';

const router = express.Router();
export default router;

const client = new MongoClient('mongodb://localhost:27017');

await client.connect();

const db = client.db('videogame');
const videogames = db.collection('videogames');

export const UPLOADS_FOLDER = './uploads';

export async function addVideogame(post) {

    return await videogames.insertOne(post);
}

export async function deletVideogame(id){

    return await videogames.findOneAndDelete({ _id: new ObjectId(id) });
}

export async function deleteVideogames(){

    return await videogames.deleteMany();
}

export async function getVideogames(){

    return await videogames.find().toArray();
}

export async function getVideogame(id){

    return await videogames.findOne({ _id: new ObjectId(id) });
}

