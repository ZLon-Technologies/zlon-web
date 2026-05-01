// Customer-facing salon queries must never include direct contact fields.
export const CUSTOMER_SAFE_SALON_SELECT = 'id,name,imageUrl,location,price,lat,lng';
