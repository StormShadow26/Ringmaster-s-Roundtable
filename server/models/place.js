import mongoose from "mongoose";

const placeSchema = new mongoose.Schema({
  name: { type: String, required: true},
  photo: { type: String, required: true },
  rating: { type: Number, required: true},
  lat: { type: Number, required: true},
  lon: { type: Number, required: true },
  description: { type: String, required: true},
});

const Place = mongoose.model("Place", placeSchema);
export default Place;
