import Place from "../models/place.js";

// Add new place
export const addPlace = async (req, res) => {
  try {
    const { name, rating, lat, lon, description } = req.body;
    if (!req.file) return res.status(400).json({ error: "Photo is required" });

    const photoUrl = req.file.path; // Cloudinary URL
    const place = new Place({ name, photo: photoUrl, rating, lat, lon, description });
    await place.save();

    res.status(201).json(place);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all places
export const getAllPlaces = async (req, res) => {
  try {
    const places = await Place.find();
    res.json(places);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
