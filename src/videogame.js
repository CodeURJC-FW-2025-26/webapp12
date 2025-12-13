import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';

const router = express.Router();
export default router;

// MongoDB client and collection setup
const client = new MongoClient('mongodb://localhost:27017');
await client.connect();
const db = client.db('videogame');
const videogames = db.collection('videogames');

await videogames.createIndex(
    { title: "text"},
    { name: "text_search_index" }
  );

// Folder where uploaded images are stored
export const UPLOADS_FOLDER = './uploads';

// Create a new videogame document
export async function addVideogame(game) {

    return await videogames.insertOne(game);

}

// Delete one videogame by id 
export async function deleteVideogame(id) {
    const result = await videogames.findOneAndDelete({ _id: new ObjectId(id) });
    return result.value; // return the deleted document (or null)
  }

// Delete all videogames
export async function deleteVideogames() {
    return await videogames.deleteMany();
}

// Get all videogames
export async function getVideogames() {
    return await videogames.find().toArray();
}

// Get a single videogame by id
export async function getVideogame(id) {
    return await videogames.findOne({ _id: new ObjectId(id) });
}

// Search videogames using text index first, fallback to regex on title
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

// Append a new comment to a videogame
export async function addComment(id, comment) {
    return await videogames.updateOne(
        { _id: new ObjectId(id) },
        { $push: { comments: comment } }
    );
}

// Remove a comment by its id from a videogame
export async function deleteComment(gameId, commentId) {
    return await videogames.updateOne(
        { _id: new ObjectId(gameId) },
        { $pull: { comments: { _id: new ObjectId(commentId) } } }
    );
}

// Update text and stars of a specific comment
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


// Find a videogame by exact title
export async function getVideogameByTitle(title) {
  return db.collection('videogames').findOne({ title });
}

// Update videogame fields by id
export async function updateVideogame(id, data) {
  return db.collection('videogames').updateOne(
    { _id: new ObjectId(id) },
    { $set: data }
  );
}
