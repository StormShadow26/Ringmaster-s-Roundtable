import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import {
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  X,
  Loader2,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

// --- CONFIGURATION ---
const API_BASE = "http://localhost:5000/api/users";

const token = localStorage.getItem("jwtToken"); // Replace "token" with your key
let userId = null;

if (token) {
  try {
    const payloadBase64 = token.split(".")[1]; // JWT payload
    const decodedPayload = JSON.parse(atob(payloadBase64));
    userId = decodedPayload.userId || decodedPayload.id; // Adjust based on your token's payload
  } catch (err) {
    console.error("Error decoding JWT token:", err);
  }
}

export default function PhotoGallery() {
  const [images, setImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    setMessage("Loading gallery...");
    try {
      const res = await axios.get(`${API_BASE}/images/${userId}`);
      setImages(res.data);
      setMessage("Gallery loaded!");
    } catch (err) {
      console.error("Error fetching images:", err);
      setMessage("Error loading images. Is the backend running?");
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  }, [userId]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage("Please select a file to upload.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    setMessage("Uploading...");

    const formData = new FormData();
    formData.append("image", file);

    try {
      await axios.post(`${API_BASE}/upload/${userId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMessage("Image uploaded successfully!");
      await fetchImages();
    } catch (err) {
      console.error("Upload error:", err.response?.data || err.message);
      setMessage(
        `Upload Failed: ${err.response?.data?.message || err.message}`
      );
    } finally {
      setLoading(false);
      setUploadProgress(0);
      setTimeout(() => setMessage(""), 5000);
    }
  };

  const handleDelete = async (publicId) => {
    setLoading(true);
    setMessage("Deleting...");
    setIsConfirmingDelete(null);
    try {
      await axios.delete(
        `${API_BASE}/delete/${userId}/${encodeURIComponent(publicId)}`
      );
      setMessage("Image deleted successfully!");
      await fetchImages();
    } catch (err) {
      console.error("Delete error:", err.response?.data || err.message);
      setMessage(
        `Delete Failed: ${err.response?.data?.message || err.message}`
      );
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const showNextImage = useCallback(() => {
    setSelectedImageIndex((prevIndex) => (prevIndex + 1) % images.length);
  }, [images.length]);

  const showPrevImage = useCallback(() => {
    setSelectedImageIndex(
      (prevIndex) => (prevIndex - 1 + images.length) % images.length
    );
  }, [images.length]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedImageIndex !== null) {
        if (e.key === "ArrowRight") showNextImage();
        else if (e.key === "ArrowLeft") showPrevImage();
        else if (e.key === "Escape") setSelectedImageIndex(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImageIndex, showNextImage, showPrevImage]);

  const selectedImageUrl =
    selectedImageIndex !== null ? images[selectedImageIndex]?.url : null;
  const selectedImagePublicId =
    selectedImageIndex !== null ? images[selectedImageIndex]?.public_id : null;

  return (
    <div className="relative min-h-screen bg-white font-sans text-gray-800 p-4 sm:p-8 md:p-10 lg:p-12">
      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto bg-white rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 border border-orange-200">
        <h1 className="text-5xl font-extrabold text-center text-orange-600 mb-4 tracking-tight">
          My Radiant Gallery 🌟
        </h1>
        <p className="text-lg text-center text-gray-600 mb-10 max-w-3xl mx-auto">
          Capture and cherish your moments. Effortlessly upload, view, and
          manage your photos in style.
        </p>

        {/* Upload Section */}
        <form
          onSubmit={handleUpload}
          className="mb-12 flex flex-col md:flex-row justify-center items-center gap-4 bg-orange-50 p-6 rounded-2xl shadow-inner border border-orange-200"
        >
          <label className="flex items-center justify-center bg-orange-100 text-orange-700 px-6 py-3 rounded-full cursor-pointer hover:bg-orange-200 transition-all duration-300 transform hover:scale-105 shadow-md w-full md:w-auto">
            <UploadCloud className="w-5 h-5 mr-3" />
            <span className="font-semibold">
              {file ? file.name : "Choose Photo"}
            </span>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="hidden"
              ref={fileInputRef}
              accept="image/*"
              disabled={loading}
            />
          </label>
          <button
            type="submit"
            className={`inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full shadow-xl font-bold text-lg 
              ${
                loading
                  ? "bg-orange-400 cursor-not-allowed animate-pulse"
                  : "bg-orange-500 hover:bg-orange-600 active:scale-95 transition-all duration-300"
              } 
              text-white w-full md:w-auto`}
            disabled={loading || !file}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <UploadCloud className="w-5 h-5" />
            )}
            {loading ? `Uploading (${uploadProgress}%)` : "Upload Now"}
          </button>
        </form>

        {/* Message Display */}
        {message && (
          <div
            className={`mb-6 p-3 text-center rounded-lg shadow-md font-medium text-sm
              ${
                message.includes("Success") || message.includes("uploaded")
                  ? "bg-green-100 text-green-700"
                  : message.includes("Error") || message.includes("Failed")
                  ? "bg-red-100 text-red-700"
                  : "bg-orange-100 text-orange-700"
              } animate-fadeIn`}
          >
            {message}
          </div>
        )}

        {/* Gallery Grid */}
        {images.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center bg-white p-16 rounded-2xl shadow-inner border-2 border-dashed border-orange-300 mt-10 text-orange-400">
            <ImageIcon className="w-20 h-20 mb-6 animate-bounce" />
            <p className="text-3xl font-bold mb-3">Your gallery awaits!</p>
            <p className="text-lg text-gray-500">
              Start by uploading your first stunning photo.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-10">
            {images.map((img, index) => (
              <div
                key={img.public_id}
                className="relative overflow-hidden rounded-2xl shadow-xl transform hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 group aspect-square bg-white border-2 border-orange-200"
              >
                <img
                  src={img.url}
                  alt={`Gallery image ${index + 1}`}
                  className="w-full h-full object-cover cursor-zoom-in transition-transform duration-500 group-hover:scale-110"
                  onClick={() => setSelectedImageIndex(index)}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsConfirmingDelete(img.public_id);
                  }}
                  className="absolute top-3 right-3 bg-red-600 text-white p-2 rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:scale-110 shadow-lg hover:bg-red-700"
                  aria-label="Delete image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {isConfirmingDelete === img.public_id && (
                  <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center p-4 z-20 animate-fadeIn">
                    <p className="text-white text-center text-lg font-semibold mb-4">
                      Are you sure?
                    </p>
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleDelete(img.public_id)}
                        className="bg-red-500 text-white px-5 py-2 rounded-full font-bold hover:bg-red-600 transition-colors shadow-md"
                      >
                        Yes, Delete
                      </button>
                      <button
                        onClick={() => setIsConfirmingDelete(null)}
                        className="bg-gray-300 text-gray-800 px-5 py-2 rounded-full font-bold hover:bg-gray-400 transition-colors shadow-md"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ====== AUTO-SCROLL SLIDESHOW ====== */}
      {images.length > 0 && (
        <div className="mt-16 overflow-hidden relative">
          <h2 className="text-center text-2xl font-bold text-orange-600 mb-4">
            Your Memories in Motion ✨
          </h2>
          <div className="flex animate-scrollX space-x-6 hover:[animation-play-state:paused]">
            {[...images, ...images].map((img, index) => (
              <img
                key={index}
                src={img.url}
                alt={`slideshow-${index}`}
                className="w-64 h-40 object-cover rounded-2xl shadow-md border border-orange-200"
              />
            ))}
          </div>
        </div>
      )}

      {/* SLIDESHOW ANIMATION */}
      <style>{`
        @keyframes scrollX {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scrollX {
          display: flex;
          width: max-content;
          animation: scrollX 40s linear infinite;
        }
      `}</style>

      {/* Modal for enlarged image */}
      {selectedImageIndex !== null && selectedImageUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={() => setSelectedImageIndex(null)}
        >
          <div
            className="relative flex items-center justify-center h-full w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={showPrevImage}
              className="absolute left-4 md:left-8 bg-white/30 hover:bg-white/50 text-white p-3 rounded-full shadow-lg z-10 transition-all backdrop-blur-sm"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>

            <img
              src={selectedImageUrl}
              alt="Enlarged"
              className="max-h-[85vh] max-w-[85vw] object-contain rounded-2xl shadow-2xl border-4 border-white/70 animate-zoomIn"
            />

            <button
              onClick={showNextImage}
              className="absolute right-4 md:right-8 bg-white/30 hover:bg-white/50 text-white p-3 rounded-full shadow-lg z-10 transition-all backdrop-blur-sm"
            >
              <ArrowRight className="w-6 h-6" />
            </button>

            <button
              onClick={() => setSelectedImageIndex(null)}
              className="absolute top-4 right-4 bg-white/40 hover:bg-white/60 text-white p-3 rounded-full shadow-xl z-10 backdrop-blur-sm"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
