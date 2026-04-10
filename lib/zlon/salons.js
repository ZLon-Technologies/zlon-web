export const FALLBACK_SALONS = [
  {
    id: 'fallback-1',
    name: 'Noir Studio',
    area: 'Napier Town',
    city: 'Jabalpur',
    waitTime: '6 min',
    queue_status: 'available',
    type: 'premium',
    phone: '919876543210',
    latitude: 23.1731,
    longitude: 79.9342
  },
  {
    id: 'fallback-2',
    name: 'Velvet Lab',
    area: 'Civic Centre',
    city: 'Jabalpur',
    waitTime: '11 min',
    queue_status: 'available',
    type: 'standard',
    phone: '919812345670',
    latitude: 23.1702,
    longitude: 79.9384
  },
  {
    id: 'fallback-3',
    name: 'Frame & Fade',
    area: 'Wright Town',
    city: 'Jabalpur',
    waitTime: '4 min',
    queue_status: 'available',
    type: 'premium',
    phone: '919845612378',
    latitude: 23.1656,
    longitude: 79.9273
  }
];

/**
 * @param {{ id: any; salon_id: any; name: any; }} salon
 */
export function getSalonKey(salon) {
  return String(salon.id || salon.salon_id || salon.name || Math.random());
}

/**
 * @param {{ location: any; area: any; city: any; }} salon
 */
export function getSalonLocation(salon) {
  return salon.location || salon.area || salon.city || 'Nearby';
}

/**
 * @param {{ waitTime: any; wait_time: any; wait_time_label: any; }} salon
 */
export function getSalonWaitTime(salon) {
  return salon.waitTime || salon.wait_time || salon.wait_time_label || 'Check on booking';
}

/**
 * @param {{ type: any; tier: any; }} salon
 */
export function getSalonType(salon) {
  return String(salon.type || salon.tier || 'standard').toLowerCase();
}

/**
 * @param {{ whatsapp: any; waNumber: any; phone: any; phone_number: any; }} salon
 */
export function getSalonPhone(salon) {
  return String(salon.whatsapp || salon.waNumber || salon.phone || salon.phone_number || '').replace(/\D/g, '');
}

/**
 * @param {{ queue_status: any; }} salon
 */
export function isAvailableSalon(salon) {
  return String(salon.queue_status || 'available').toLowerCase() === 'available';
}

/**
 * @param {{ latitude: any; lat: any; longitude: any; lng: any; }} salon
 */
export function getSalonCoordinates(salon) {
  const lat = Number(salon.latitude ?? salon.lat);
  const lng = Number(salon.longitude ?? salon.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  return { lat, lng };
}

/**
 * @param {{ lat: number; lng: number; }} from
 * @param {{ lat: any; lng: any; }} to
 */
export function distanceBetweenMeters(from, to) {
  const radius = 6371000;
  const dLat = (to.lat - from.lat) * Math.PI / 180;
  const dLng = (to.lng - from.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180)
    * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * @param {{ id: string; name: string; area: string; city: string; waitTime: string; queue_status: string; type: string; phone: string; latitude: number; longitude: number; }[]} salons
 * @param {null} userLocation
 */
export function sortSalonsByDistance(salons, userLocation) {
  const items = Array.isArray(salons) ? [...salons] : [];
  if (!userLocation) {
    return items;
  }

  return items.sort((left, right) => {
    const leftCoords = getSalonCoordinates(left);
    const rightCoords = getSalonCoordinates(right);
    const leftDistance = leftCoords ? distanceBetweenMeters(userLocation, leftCoords) : Number.MAX_SAFE_INTEGER;
    const rightDistance = rightCoords ? distanceBetweenMeters(userLocation, rightCoords) : Number.MAX_SAFE_INTEGER;
    return leftDistance - rightDistance;
  });
}

/**
 * @param {{ location: any; area: any; city: any; }} salon
 * @param {null} userLocation
 */
export function formatDistanceLabel(salon, userLocation) {
  if (!userLocation) {
    return getSalonLocation(salon);
  }

  const coords = getSalonCoordinates(salon);
  if (!coords) {
    return getSalonLocation(salon);
  }

  const distance = distanceBetweenMeters(userLocation, coords);
  if (distance >= 1000) {
    return `${(distance / 1000).toFixed(1)} km away`;
  }

  return `${Math.round(distance)} m away`;
}

/**
 * @param {number} index
 * @param {{ banner_url: any; } | undefined} [salon]
 */
export function bannerStyle(index, salon) {
  if (salon?.banner_url) {
    return {
      backgroundImage: `linear-gradient(rgba(4, 4, 4, 0.14), rgba(4, 4, 4, 0.18)), url(${salon.banner_url})`
    };
  }

  const gradients = [
    'linear-gradient(135deg, #090909 0%, #141414 52%, #1c2a35 100%)',
    'linear-gradient(135deg, #090909 0%, #171717 55%, #15303d 100%)',
    'linear-gradient(135deg, #0c0c0c 0%, #181818 55%, #1a2240 100%)',
    'linear-gradient(135deg, #090909 0%, #181818 55%, #283522 100%)'
  ];

  return {
    backgroundImage: gradients[index % gradients.length]
  };
}

/**
 * @param {{ rpc: (arg0: string, arg1: { user_lat: any; user_lng: any; radius_m: number; salon_type: null; }) => any; from: (arg0: string) => { (): any; new (): any; select: { (arg0: string): { (): any; new (): any; order: { (arg0: string, arg1: { ascending: boolean; }): PromiseLike<{ data: any; error: any; }> | { data: any; error: any; }; new (): any; }; }; new (): any; }; }; } | null} client
 * @param {{ lat: any; lng: any; } | null} userLocation
 */
export async function fetchSalons(client, userLocation) {
  if (!client) {
    return FALLBACK_SALONS;
  }

  if (userLocation) {
    const nearby = await client.rpc('nearby_salons', {
      user_lat: userLocation.lat,
      user_lng: userLocation.lng,
      radius_m: 7000,
      salon_type: null
    });

    if (!nearby.error && Array.isArray(nearby.data) && nearby.data.length) {
      return nearby.data.map((/** @type {{ salon: any; }} */ entry) => entry.salon);
    }
  }

  const { data, error } = await client
    .from('salons')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !Array.isArray(data) || !data.length) {
    return FALLBACK_SALONS;
  }

  return data;
}
