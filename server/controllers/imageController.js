import User from "../models/user.model.js";
import cloudinary from "../config/cloudinary.js";

// Upload image
export const uploadImage = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "user_photos",
    });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.images.push({
      url: result.secure_url,
      public_id: result.public_id,
    });

    await user.save();
    res.status(200).json(user.images);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all images
export const getImages = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user.images);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete image
export const deleteImage = async (req, res) => {
  try {
    const { userId, publicId } = req.params;

    const decodedPublicId = decodeURIComponent(publicId); // decode slashes

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Remove image from Cloudinary
    await cloudinary.uploader.destroy(decodedPublicId);

    // Remove image from user.images array
    user.images = user.images.filter((img) => img.public_id !== decodedPublicId);

    await user.save();

    res.status(200).json({ message: "Image deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
