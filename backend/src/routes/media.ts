import { Hono } from "hono";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "../db/index";
import { gameMedia } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { requireSession, requireAdmin } from "../lib/middleware";
import { uploadToR2, getSignedUrl, deleteFromR2 } from "../lib/r2";

const media = new Hono();

// Validation schemas
const uploadSchema = z.object({
  gameRequestId: z.string(),
  mediaType: z.enum(["image", "video"]),
  sortOrder: z.number().default(0),
});

const batchUploadSchema = z.object({
  gameRequestId: z.string(),
  files: z.array(z.object({
    mediaType: z.enum(["image", "video"]),
    sortOrder: z.number().default(0),
  })),
});

// File size limits
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

// Allowed MIME types
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

/**
 * POST /media/upload
 * 
 * Upload a single media file
 * 
 * Requirements:
 * - User must be authenticated
 * - File must be provided in multipart/form-data
 * - gameRequestId must be provided
 * - File type must be allowed
 * - File size must be within limits
 * 
 * Returns:
 * - mediaId: Database record ID
 * - r2Key: Storage key in R2
 * - url: Signed URL to access the file (valid for 1 hour)
 */
media.post("/upload", requireSession, async (c) => {
  try {
    const user = c.get("user");
    const formData = await c.req.formData();
    
    const file = formData.get("file") as File | null;
    const gameRequestId = formData.get("gameRequestId") as string | null;
    const mediaType = formData.get("mediaType") as "image" | "video" | null;
    const sortOrder = parseInt(formData.get("sortOrder") as string || "0");
    
    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }
    
    if (!gameRequestId) {
      return c.json({ error: "gameRequestId is required" }, 400);
    }
    
    if (!mediaType || !["image", "video"].includes(mediaType)) {
      return c.json({ error: "Invalid mediaType" }, 400);
    }
    
    // Validate file type
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
    
    if (mediaType === "image" && !isImage) {
      return c.json({ 
        error: "Invalid image type",
        message: "Allowed types: JPEG, PNG, GIF, WebP",
      }, 400);
    }
    
    if (mediaType === "video" && !isVideo) {
      return c.json({ 
        error: "Invalid video type",
        message: "Allowed types: MP4, WebM, QuickTime",
      }, 400);
    }
    
    // Validate file size
    const maxSize = mediaType === "image" ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
    if (file.size > maxSize) {
      return c.json({ 
        error: "File too large",
        message: `Max size: ${maxSize / 1024 / 1024}MB`,
      }, 400);
    }
    
    // Generate unique R2 key
    const extension = file.name.split(".").pop() || "bin";
    const timestamp = Date.now();
    const randomId = nanoid(8);
    const r2Key = `game-media/${user.id}/${timestamp}_${randomId}.${extension}`;
    
    // Upload to R2
    const buffer = await file.arrayBuffer();
    await uploadToR2(r2Key, buffer, file.type);
    
    // Create database record
    const mediaId = `media_${nanoid(16)}`;
    
    const [mediaRecord] = await db.insert(gameMedia).values({
      id: mediaId,
      gameRequestId,
      gameId: null, // Set after game request approval
      mediaType,
      r2Key,
      sortOrder,
    }).returning();
    
    // Generate signed URL (valid for 1 hour)
    const signedUrl = await getSignedUrl(r2Key, 3600);
    
    return c.json({
      success: true,
      media: {
        id: mediaRecord!.id,
        r2Key: mediaRecord!.r2Key,
        mediaType: mediaRecord!.mediaType,
        sortOrder: mediaRecord!.sortOrder,
        url: signedUrl,
        createdAt: mediaRecord!.createdAt,
      },
    });
  } catch (error) {
    console.error("Media upload error:", error);
    return c.json({ 
      error: "Upload failed",
      message: "An error occurred while uploading the file.",
    }, 500);
  }
});

/**
 * POST /media/batch-upload
 * 
 * Upload multiple media files at once
 * 
 * More efficient than multiple single uploads
 * All files must belong to the same gameRequestId
 */
media.post("/batch-upload", requireSession, async (c) => {
  try {
    const user = c.get("user");
    const formData = await c.req.formData();
    
    const gameRequestId = formData.get("gameRequestId") as string | null;
    
    if (!gameRequestId) {
      return c.json({ error: "gameRequestId is required" }, 400);
    }
    
    // Collect all files from form data
    const files: Array<{
      file: File;
      mediaType: "image" | "video";
      sortOrder: number;
    }> = [];
    
    let index = 0;
    while (true) {
      const file = formData.get(`file_${index}`) as File | null;
      if (!file) break;
      
      const mediaType = formData.get(`mediaType_${index}`) as "image" | "video" | null;
      const sortOrder = parseInt(formData.get(`sortOrder_${index}`) as string || String(index));
      
      if (!mediaType || !["image", "video"].includes(mediaType)) {
        return c.json({ 
          error: `Invalid mediaType for file ${index}`,
        }, 400);
      }
      
      files.push({ file, mediaType, sortOrder });
      index++;
    }
    
    if (files.length === 0) {
      return c.json({ error: "No files provided" }, 400);
    }
    
    // Upload all files
    const uploadedMedia = [];
    
    for (let i = 0; i < files.length; i++) {
      const { file, mediaType, sortOrder } = files[i]!;
      
      // Validate file type
      const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
      const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
      
      if (mediaType === "image" && !isImage) {
        return c.json({ 
          error: `File ${i}: Invalid image type`,
          message: "Allowed types: JPEG, PNG, GIF, WebP",
        }, 400);
      }
      
      if (mediaType === "video" && !isVideo) {
        return c.json({ 
          error: `File ${i}: Invalid video type`,
          message: "Allowed types: MP4, WebM, QuickTime",
        }, 400);
      }
      
      // Validate file size
      const maxSize = mediaType === "image" ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
      if (file.size > maxSize) {
        return c.json({ 
          error: `File ${i}: Too large`,
          message: `Max size: ${maxSize / 1024 / 1024}MB`,
        }, 400);
      }
      
      // Generate unique R2 key
      const extension = file.name.split(".").pop() || "bin";
      const timestamp = Date.now();
      const randomId = nanoid(8);
      const r2Key = `game-media/${user.id}/${timestamp}_${randomId}.${extension}`;
      
      // Upload to R2
      const buffer = await file.arrayBuffer();
      await uploadToR2(r2Key, buffer, file.type);
      
      // Create database record
      const mediaId = `media_${nanoid(16)}`;
      
      const [mediaRecord] = await db.insert(gameMedia).values({
        id: mediaId,
        gameRequestId,
        gameId: null,
        mediaType,
        r2Key,
        sortOrder,
      }).returning();
      
      // Generate signed URL
      const signedUrl = await getSignedUrl(r2Key, 3600);
      
      uploadedMedia.push({
        id: mediaRecord!.id,
        r2Key: mediaRecord!.r2Key,
        mediaType: mediaRecord!.mediaType,
        sortOrder: mediaRecord!.sortOrder,
        url: signedUrl,
        createdAt: mediaRecord!.createdAt,
      });
    }
    
    return c.json({
      success: true,
      count: uploadedMedia.length,
      media: uploadedMedia,
    });
  } catch (error) {
    console.error("Batch upload error:", error);
    return c.json({ 
      error: "Batch upload failed",
      message: "An error occurred while uploading files.",
    }, 500);
  }
});

/**
 * GET /media/:mediaId
 * 
 * Get media metadata (without the actual file)
 * 
 * No authentication required
 * Returns basic media information
 */
media.get("/:mediaId", async (c) => {
  try {
    const mediaId = c.req.param("mediaId");
    
    const mediaRecord = await db.query.gameMedia.findFirst({
      where: eq(gameMedia.id, mediaId),
    });
    
    if (!mediaRecord) {
      return c.json({ error: "Media not found" }, 404);
    }
    
    return c.json({
      media: {
        id: mediaRecord.id,
        mediaType: mediaRecord.mediaType,
        sortOrder: mediaRecord.sortOrder,
        gameRequestId: mediaRecord.gameRequestId,
        gameId: mediaRecord.gameId,
        createdAt: mediaRecord.createdAt,
      },
    });
  } catch (error) {
    console.error("Get media error:", error);
    return c.json({ 
      error: "Failed to fetch media",
    }, 500);
  }
});

/**
 * GET /media/:mediaId/url
 * 
 * Get signed URL to access the media file
 * 
 * No authentication required
 * Returns a temporary signed URL (valid for 1 hour)
 */
media.get("/:mediaId/url", async (c) => {
  try {
    const mediaId = c.req.param("mediaId");
    const expiresIn = parseInt(c.req.query("expiresIn") || "3600"); // Default 1 hour
    
    // Limit expiration time to 24 hours
    const maxExpiry = 24 * 60 * 60;
    const validExpiry = Math.min(expiresIn, maxExpiry);
    
    const mediaRecord = await db.query.gameMedia.findFirst({
      where: eq(gameMedia.id, mediaId),
    });
    
    if (!mediaRecord) {
      return c.json({ error: "Media not found" }, 404);
    }
    
    // Generate signed URL
    const signedUrl = await getSignedUrl(mediaRecord.r2Key, validExpiry);
    
    return c.json({
      url: signedUrl,
      expiresIn: validExpiry,
      expiresAt: new Date(Date.now() + validExpiry * 1000).toISOString(),
    });
  } catch (error) {
    console.error("Get signed URL error:", error);
    return c.json({ 
      error: "Failed to generate signed URL",
    }, 500);
  }
});

/**
 * GET /media/request/:gameRequestId
 * 
 * List all media for a game request
 * 
 * No authentication required
 * Useful for displaying media in game request reviews
 */
media.get("/request/:gameRequestId", async (c) => {
  try {
    const gameRequestId = c.req.param("gameRequestId");
    
    const mediaList = await db.query.gameMedia.findMany({
      where: eq(gameMedia.gameRequestId, gameRequestId),
      orderBy: (gameMedia, { asc }) => [asc(gameMedia.sortOrder)],
    });
    
    // Generate signed URLs for all media
    const mediaWithUrls = await Promise.all(
      mediaList.map(async (m) => {
        const signedUrl = await getSignedUrl(m.r2Key, 3600);
        return {
          id: m.id,
          mediaType: m.mediaType,
          sortOrder: m.sortOrder,
          url: signedUrl,
          createdAt: m.createdAt,
        };
      })
    );
    
    return c.json({
      gameRequestId,
      count: mediaWithUrls.length,
      media: mediaWithUrls,
    });
  } catch (error) {
    console.error("List request media error:", error);
    return c.json({ 
      error: "Failed to fetch media",
    }, 500);
  }
});

/**
 * DELETE /media/:mediaId
 * 
 * Delete media file (admin only)
 * 
 * Requirements:
 * - User must be authenticated
 * - User must be admin
 * - Media cannot be associated with an approved game
 * 
 * Deletes both the database record and the R2 file
 */
media.delete("/:mediaId", requireSession, requireAdmin, async (c) => {
  try {
    const mediaId = c.req.param("mediaId");
    
    const mediaRecord = await db.query.gameMedia.findFirst({
      where: eq(gameMedia.id, mediaId),
    });
    
    if (!mediaRecord) {
      return c.json({ error: "Media not found" }, 404);
    }
    
    // Check if media is associated with an approved game
    if (mediaRecord.gameId) {
      return c.json({ 
        error: "Cannot delete",
        message: "Media is associated with an approved game",
      }, 400);
    }
    
    // Delete from R2
    await deleteFromR2(mediaRecord.r2Key);
    
    // Delete from database
    await db.delete(gameMedia).where(eq(gameMedia.id, mediaId));
    
    return c.json({
      success: true,
      message: "Media deleted successfully",
    });
  } catch (error) {
    console.error("Delete media error:", error);
    return c.json({ 
      error: "Failed to delete media",
    }, 500);
  }
});

export default media;