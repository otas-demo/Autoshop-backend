import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

console.log("Connecting to:", MONGODB_URI);

const supplierProfileSchema = new mongoose.Schema({}, { strict: false });
const SupplierProfile = mongoose.model("SupplierProfile", supplierProfileSchema, "supplierprofiles");

const purchasingSchema = new mongoose.Schema({}, { strict: false });
const Purchasing = mongoose.model("Purchasing", purchasingSchema, "purchasings");

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected!");

  const supplierIdStr = "6a754a3a5c9bad6fb8e7a071";
  const supplierId = new mongoose.Types.ObjectId(supplierIdStr);

  const supplier = await SupplierProfile.findById(supplierId);
  console.log("Supplier found:", supplier);

  const purchasesCount = await Purchasing.countDocuments({});
  console.log("Total purchases in DB:", purchasesCount);

  const purchasesForSupplier = await Purchasing.find({ supplierId: supplierId });
  console.log(`Purchases for supplier ${supplierIdStr}:`, purchasesForSupplier.length);
  if (purchasesForSupplier.length > 0) {
    console.log("Sample purchase:", purchasesForSupplier[0]);
  } else {
    // print some purchases to inspect their supplierId field
    const samples = await Purchasing.find({}).limit(5);
    console.log("Sample purchases in DB:");
    samples.forEach(s => {
      console.log(`- ID: ${s._id}, supplierId: ${s.supplierId} (Type: ${s.supplierId?.constructor?.name})`);
    });
  }

  await mongoose.disconnect();
}

run().catch(console.error);
