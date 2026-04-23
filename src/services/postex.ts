import crypto from 'crypto';

const POSTEX_API_URL = process.env.POSTEX_API_URL || '';
const POSTEX_API_TOKEN = process.env.POSTEX_API_TOKEN || '';

export interface PostExOrder {
  order_ref: string;
  tracking_number: string;
  current_status: string;
  status_type: string;
  order_date: string;
}

export async function fetchPostExOrders(startDate: Date, endDate: Date): Promise<PostExOrder[]> {
  if (!POSTEX_API_URL || !POSTEX_API_TOKEN) {
    console.warn('PostEx API credentials not configured');
    return [];
  }
  
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  const url = `${POSTEX_API_URL}/orders?start_date=${start}&end_date=${end}&page=1`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${POSTEX_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`PostEx API error: ${response.status}`);
    }

    const data = await response.json();
    return data.orders || [];
  } catch (error) {
    console.error('PostEx fetch error:', error);
    return [];
  }
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function hashOrder(order: PostExOrder): string {
  return crypto.createHash('md5').update(JSON.stringify(order)).digest('hex');
}