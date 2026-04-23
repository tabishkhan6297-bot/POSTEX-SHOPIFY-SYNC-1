import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
import Link from 'next/link';

export default async function Dashboard() {
  let orders: any[] = [];
  let stats = { total: 0, delivered: 0, returned: 0, pending: 0 };
  let error = '';

  try {
    await connectDB();
    orders = await Order.find().sort({ lastSyncedAt: -1 }).limit(100).lean();
    
    stats = {
      total: orders.length,
      delivered: orders.filter(o => o.isDelivered).length,
      returned: orders.filter(o => o.isReturn).length,
      pending: orders.filter(o => !o.isDelivered && !o.isReturn).length,
    };
  } catch (e) {
    error = e instanceof Error ? e.message : 'Database connection failed';
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-8">📦 PostEx + Shopify Sync</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Error:</strong> {error}
          <p className="text-sm mt-1">Check your MONGODB_URI environment variable</p>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded shadow">
          <p className="text-gray-500">Total Orders</p>
          <p className="text-3xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-green-50 p-6 rounded shadow">
          <p className="text-gray-500">✅ Delivered</p>
          <p className="text-3xl font-bold text-green-600">{stats.delivered}</p>
        </div>
        <div className="bg-red-50 p-6 rounded shadow">
          <p className="text-gray-500">↩️ Returned</p>
          <p className="text-3xl font-bold text-red-600">{stats.returned}</p>
        </div>
        <div className="bg-yellow-50 p-6 rounded shadow">
          <p className="text-gray-500">⏳ Pending</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Order Ref</th>
              <th className="p-3 text-left">Tracking</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Result</th>
              <th className="p-3 text-left">Last Synced</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  No orders found. Click &quot;Run Sync&quot; to fetch orders from PostEx.
                </td>
              </tr>
            )}
            {orders.map(order => (
              <tr key={order.orderRef} className="border-t">
                <td className="p-3 font-mono text-sm">{order.orderRef}</td>
                <td className="p-3 font-mono text-sm">{order.trackingNumber}</td>
                <td className="p-3">{order.currentStatus || '-'}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-sm ${
                    order.isDelivered ? 'bg-green-100 text-green-700' : 
                    order.isReturn ? 'bg-red-100 text-red-700' : 
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {order.simpleResult || 'pending'}
                  </span>
                </td>
                <td className="p-3 text-sm text-gray-500">
                  {order.lastSyncedAt ? new Date(order.lastSyncedAt).toLocaleString() : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-center">
        <Link href="/api/sync" className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700">
          🔄 Run Sync Now
        </Link>
      </div>
    </div>
  );
}