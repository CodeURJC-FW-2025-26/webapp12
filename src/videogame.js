import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';

const router = express.Router();
export default router;

const client = new MongoClient('mongodb://localhost:27017');

await client.connect();

const db = client.db('videogame');
const videogames = db.collection('videogames');

await videogames.createIndex(
    { title: "text"},
    { name: "text_search_index" }
  );

export const UPLOADS_FOLDER = './uploads';

export async function addVideogame(post) {

    return await videogames.insertOne(post);

}

export async function deleteVideogame(id) {
    
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

export async function searchVideogames(searchBar) {
    if (!searchBar || searchBar.trim() === "") {
        return await videogames.find().toArray();
    }

    const regex = new RegExp(searchBar, 'i');

    const textResults = await videogames
        .find({ $text: { $search: searchBar } }, { score: { $meta: "textScore" } })
        .sort({ score: { $meta: "textScore" } })
        .toArray();

    if (textResults.length > 0) return textResults;

    return await videogames
        .find({title: regex})
        .toArray();
}

export async function addComment(id, comment) {
    return await videogames.updateOne(
        { _id: new ObjectId(id) },
        { $push: { comments: comment } }
    );
}

export async function deleteComment(gameId, commentId) {
    return await videogames.updateOne(
        { _id: new ObjectId(gameId) },
        { $pull: { comments: { _id: new ObjectId(commentId) } } }
    );
}

export async function editComment(gameId, commentId, newText, newStars) {
    return await videogames.updateOne(
        { _id: new ObjectId(gameId), "comments._id": new ObjectId(commentId) },
        { 
            $set: { 
                "comments.$.text": newText,
                "comments.$.stars": newStars
            } 
        }
    );
}