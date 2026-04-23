const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL || '';
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || '';
const SHOPIFY_API_VERSION = '2024-01';

async function shopifyFetch(query: string, variables: Record<string, unknown> = {}) {
  if (!SHOPIFY_STORE_URL || !SHOPIFY_ACCESS_TOKEN) {
    throw new Error('Shopify credentials not configured');
  }

  const endpoint = `https://${SHOPIFY_STORE_URL}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  return response.json();
}

export async function getOrdersFromShopify() {
  const query = `
    query getOrders($first: Int!) {
      orders(first: $first) {
        edges {
          node {
            id
            name
            fulfillmentStatus
            fulfillmentOrders {
              edges {
                node {
                  id
                  status
                  trackingInfo { number company }
                }
              }
            }
          }
        }
      }
    }
  `;
  try {
    const data = await shopifyFetch(query, { first: 250 });
    return data.data?.orders?.edges || [];
  } catch (error) {
    console.error('Shopify fetch error:', error);
    return [];
  }
}

export async function updateFulfillment(orderId: string, trackingNumber: string) {
  const mutation = `
    mutation createFulfillment($orderId: ID!, $trackingNumber: String!) {
      fulfillmentCreateV2(
        input: {
          orderId: $orderId
          trackingInfo: [{ number: $trackingNumber, company: "PostEx" }]
          notifyCustomer: true
        }
      ) {
        fulfillment { id status }
        userErrors { field message }
      }
    }
  `;
  return shopifyFetch(mutation, { orderId, trackingNumber });
}