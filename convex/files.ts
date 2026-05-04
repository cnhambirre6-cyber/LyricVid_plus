import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation({
  handler: async (ctx) => ctx.storage.generateUploadUrl(),
});

export const getStorageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => ctx.storage.getUrl(storageId),
});

export const deleteFile = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => ctx.storage.delete(storageId),
});
