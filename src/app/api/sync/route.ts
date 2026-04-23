import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
import { fetchPostExOrders, hashOrder } from '@/services/postex';
import { updateFulfillment } from '@/services/shopify';

export async function GET() {
  try {
    await connectDB();
    const now = new Date();
    const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const postexOrders = await fetchPostExOrders(startDate, now);
    let updated = 0;
    let created = 0;

    for (const order of postexOrders) {
      const newHash = hashOrder(order);
      const existing = await Order.findOne({ orderRef: order.order_ref });

      if (!existing || existing.rowHash !== newHash) {
        const isDelivered = ['delivered', 'completed'].includes(order.current_status.toLowerCase());
        const isReturn = ['returned', 'rto'].includes(order.current_status.toLowerCase());

        const orderData = {
          orderRef: order.order_ref,
          trackingNumber: order.tracking_number,
          currentStatus: order.current_status,
          statusType: order.status_type,
          orderDate: new Date(order.order_date),
          simpleResult: isDelivered ? 'delivered' : isReturn ? 'return' : 'pending',
          isReturn,
          isDelivered,
          isStuck: !isDelivered && !isReturn,
          rowHash: newHash,
          lastSyncedAt: now,
        };

        if (existing) {
          existing.set(orderData);
          await existing.save();
          updated++;
          
          if (isDelivered && existing.shopifyFulfillmentId) {
            try {
              await updateFulfillment(existing.shopifyFulfillmentId, order.tracking_number);
            } catch (e) {
              console.error('Shopify fulfillment error:', e);
            }
          }
        } else {
          await Order.create(orderData);
          created++;
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      totalFetched: postexOrders.length, 
      created,
      updated, 
      syncedAt: now.toISOString() 
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}