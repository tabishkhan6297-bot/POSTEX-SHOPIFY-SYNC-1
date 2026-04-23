import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  orderRef: string;
  trackingNumber: string;
  currentStatus: string;
  statusType: string;
  orderDate: Date;
  simpleResult: string;
  isReturn: boolean;
  isDelivered: boolean;
  isStuck: boolean;
  shopifyFulfillmentId?: string;
  shopifyFulfillmentStatus?: string;
  lastSyncedAt: Date;
  rowHash: string;
}

const OrderSchema = new Schema({
  orderRef: { type: String, required: true, unique: true },
  trackingNumber: { type: String, required: true, index: true },
  currentStatus: { type: String },
  statusType: { type: String },
  orderDate: { type: Date },
  simpleResult: { type: String },
  isReturn: { type: Boolean, default: false },
  isDelivered: { type: Boolean, default: false },
  isStuck: { type: Boolean, default: false },
  shopifyFulfillmentId: { type: String },
  shopifyFulfillmentStatus: { type: String },
  lastSyncedAt: { type: Date, default: Date.now },
  rowHash: { type: String },
});

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);