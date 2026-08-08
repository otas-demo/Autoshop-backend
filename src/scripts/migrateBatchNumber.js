import mongoose from "mongoose";
import dotenv from "dotenv";
import WarehouseStock from "../models/warehouse.model.js";
import StorefrontInventory from "../models/storefrontInventory.model.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined in environment variables.");
  process.exit(1);
}

async function migrate() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB successfully.");

    // Update WarehouseStock
    console.log("Migrating WarehouseStock documents...");
    const warehouseResult = await WarehouseStock.updateMany(
      { batchNumber: { $exists: false } },
      { $set: { batchNumber: "__LEGACY__", expiryDate: null, manufacturingDate: null } }
    );
    console.log(`WarehouseStock updated: ${warehouseResult.modifiedCount} documents.`);

    // Update StorefrontInventory
    console.log("Migrating StorefrontInventory documents...");
    const storefrontResult = await StorefrontInventory.updateMany(
      { batchNumber: { $exists: false } },
      { $set: { batchNumber: "__LEGACY__", expiryDate: null, manufacturingDate: null } }
    );
    console.log(`StorefrontInventory updated: ${storefrontResult.modifiedCount} documents.`);

    // Drop old unique indexes
    try {
      console.log("Dropping old WarehouseStock index (inventoryId_1_warehouseId_1)...");
      await WarehouseStock.collection.dropIndex("inventoryId_1_warehouseId_1");
      console.log("Successfully dropped WarehouseStock index.");
    } catch (e) {
      console.log("WarehouseStock index not found or already dropped:", e.message);
    }

    try {
      console.log("Dropping old StorefrontInventory index (inventoryId_1_storefrontId_1)...");
      await StorefrontInventory.collection.dropIndex("inventoryId_1_storefrontId_1");
      console.log("Successfully dropped StorefrontInventory index.");
    } catch (e) {
      console.log("StorefrontInventory index not found or already dropped:", e.message);
    }

    console.log("Data migration successfully completed!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

migrate();
