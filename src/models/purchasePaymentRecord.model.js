import mongoose from "mongoose";

const purchasePaymentRecordSchema = new mongoose.Schema(
  {
    purchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purchasing",
      required: [true, "Purchase order ID is required"],
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupplierProfile",
      required: [true, "Supplier ID is required"],
    },
    paidAmount: {
      type: Number,
      required: [true, "Paid amount is required"],
      min: [1, "Paid amount must be greater than 0"],
    },
    paymentDate: {
      type: Date,
      default: Date.now,
      required: [true, "Payment date is required"],
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "kpay", "wave", "bank_transfer", "other"],
      default: "cash",
    },
    notes: {
      type: String,
      trim: true,
      default: null,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: [true, "Recorded by is required"],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for query performance
purchasePaymentRecordSchema.index({ purchaseId: 1 });
purchasePaymentRecordSchema.index({ supplierId: 1 });
purchasePaymentRecordSchema.index({ purchaseId: 1, isDeleted: 1 });
purchasePaymentRecordSchema.index({ paymentDate: -1 });

const PurchasePaymentRecord = mongoose.model(
  "PurchasePaymentRecord",
  purchasePaymentRecordSchema
);

export default PurchasePaymentRecord;
