import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { cloudinary } from "../utils/cloudinary.js";
import {Video} from "../models/Video.model.js"; 

const getAllVideos = asyncHandler(async (req, res) => {
    try {
        let { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query;

        page = Math.max(parseInt(page), 1);
        limit = Math.max(parseInt(limit), 1);

        const filter = {};
        if (query) filter.title = { $regex: query, $options: "i" };
        if (userId) filter.userId = userId;

        const sortOptions = { [sortBy]: sortType === "asc" ? 1 : -1 };

        const [videos, totalVideos] = await Promise.all([
            Video.find(filter).sort(sortOptions).skip((page - 1) * limit).limit(limit),
            Video.countDocuments(filter),
        ]);

        res.status(200).json(new ApiResponse(200, { videos, totalVideos }, "Videos fetched successfully"));
    } catch (error) {
        console.error("Error fetching videos:", error);
        res.status(500).json(new ApiError(500, "Internal Server Error"));
    }
});

const publishAVideo = asyncHandler(async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json(new ApiError(400, "Video file is required"));
        }

        const { title, description } = req.body;
        if (!title || !description) {
            return res.status(400).json(new ApiError(400, "Title and description are required"));
        }

        // ✅ Upload video to Cloudinary
        const uploadedVideo = await cloudinary.uploader.upload(req.file.path, {
            resource_type: "video",
            folder: "videos",
        });

        if (!uploadedVideo || !uploadedVideo.secure_url) {
            return res.status(500).json(new ApiError(500, "Failed to upload video"));
        }

        // ✅ Save video details in Database
        const newVideo = await Video.create({
            title,
            description,
            videoUrl: uploadedVideo.secure_url,
            publicId: uploadedVideo.public_id,
            userId: req.user.id, // Assuming authentication middleware
        });

        res.status(201).json(new ApiResponse(201, newVideo, "Video published successfully"));
    } catch (error) {
        console.error("Error publishing video:", error);
        res.status(500).json(new ApiError(500, "Internal Server Error"));
    }
});

export { getAllVideos, publishAVideo };
