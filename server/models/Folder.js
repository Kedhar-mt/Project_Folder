const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
    name: { type: String, required: true },  // Store the original file name
    path: { type: String, required: true },  // Store the image path
});

const folderSchema = new mongoose.Schema({
    name: { type: String, required: true },
    images: [imageSchema],  // Array of image objects
    isDisabled: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Folder", folderSchema);
