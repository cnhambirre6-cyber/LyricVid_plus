import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Returns a short-lived upload URL that the client POSTs the file to directly.
// The resulting storageId is then passed to the relevant linkAudio / characters.update mutation.
export const generateUploadUrl = mutation({
  handler: async (ctx) => ctx.storage.generateUploadUrl(),
});

// Resolves a storage ID to a presigned URL for playback or display.
// Only needed when the workspace query cannot be used (e.g. one-off asset resolution).
export const getStorageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => ctx.storage.getUrl(storageId),
});

// NOTE: deleteFile is intentionally omitted.
// All storage cleanup is performed inside the mutation that owns the record
// (projects.removeAudio, projects.remove, characters.remove, scenes.remove)
// to ensure storage objects are never orphaned or deleted by unauthorised callers.
