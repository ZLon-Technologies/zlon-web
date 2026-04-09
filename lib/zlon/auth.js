function normalizeUserType(value) {
  const type = String(value || '').toLowerCase();
  return type === 'owner' || type === 'customer' ? type : '';
}

function getMetadataUserType(user) {
  return normalizeUserType(
    user && ((user.app_metadata && user.app_metadata.user_type) || (user.user_metadata && user.user_metadata.user_type))
  );
}

export function normalizeDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

export function toE164Phone(countryCode, rawValue) {
  const digits = normalizeDigits(rawValue);
  if (!digits) {
    return '';
  }

  return `${countryCode}${digits}`;
}

export async function getSession(client) {
  if (!client || !client.auth) {
    return null;
  }

  const { data, error } = await client.auth.getSession();
  if (error || !data || !data.session) {
    return null;
  }

  return data.session;
}

async function getProfileUserType(client, user) {
  if (!client || !user?.id) {
    return '';
  }

  const { data, error } = await client
    .from('profiles')
    .select('user_type')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !data) {
    return '';
  }

  return normalizeUserType(data.user_type);
}

async function hasLinkedOwnerSalon(client, user) {
  if (!client || !user?.id) {
    return false;
  }

  const direct = await client
    .from('salons')
    .select('id')
    .eq('owner_id', user.id)
    .limit(1)
    .maybeSingle();

  if (!direct.error && direct.data) {
    return true;
  }

  const userEmail = String(user.email || '').trim().toLowerCase();
  if (userEmail) {
    for (const column of ['owner_email', 'email']) {
      const matched = await client
        .from('salons')
        .select('id')
        .ilike(column, userEmail)
        .limit(1)
        .maybeSingle();

      if (!matched.error && matched.data) {
        return true;
      }
    }
  }

  const userPhone = normalizeDigits(user.phone || user.user_metadata?.phone);
  if (userPhone) {
    const { data, error } = await client
      .from('salons')
      .select('id, owner_phone, phone, whatsapp, waNumber, phone_number')
      .limit(100);

    if (!error && Array.isArray(data)) {
      const matched = data.some((salon) => {
        return ['owner_phone', 'phone', 'whatsapp', 'waNumber', 'phone_number'].some((column) => {
          const candidate = normalizeDigits(salon[column]);
          return candidate && (candidate === userPhone || candidate.endsWith(userPhone.slice(-10)));
        });
      });

      if (matched) {
        return true;
      }
    }
  }

  return false;
}

export async function resolveUserType(client, session) {
  if (!session?.user) {
    return '';
  }

  const profileType = await getProfileUserType(client, session.user);
  if (profileType) {
    return profileType;
  }

  const metadataType = getMetadataUserType(session.user);
  if (metadataType) {
    return metadataType;
  }

  if (await hasLinkedOwnerSalon(client, session.user)) {
    return 'owner';
  }

  return 'customer';
}

export async function syncProfile(client, user, userType, phone = null) {
  if (!client || !user?.id || !normalizeUserType(userType)) {
    return null;
  }

  const { data, error } = await client.rpc('sync_current_user_profile', {
    next_user_type: normalizeUserType(userType),
    next_phone: phone || null
  });

  if (error) {
    return null;
  }

  return data;
}

export async function fetchSalonDirectory(client) {
  const { data, error } = await client.from('salons').select('*').limit(300);
  if (error || !Array.isArray(data)) {
    return [];
  }
  return data;
}

export async function claimOwnerSalon(client, user, phoneOverride = null) {
  if (!client || !user?.id) {
    return { linked: false, message: 'Owner access is unavailable right now.' };
  }

  const alreadyLinked = await client
    .from('salons')
    .select('*')
    .eq('owner_id', user.id)
    .limit(1)
    .maybeSingle();

  if (!alreadyLinked.error && alreadyLinked.data) {
    return { linked: true, salon: alreadyLinked.data };
  }

  const directory = await fetchSalonDirectory(client);
  const ownerEmail = String(user.email || '').trim().toLowerCase();
  const ownerPhone = normalizeDigits(phoneOverride || user.phone || user.user_metadata?.phone);

  const candidate = directory.find((salon) => {
    const emailMatch = ownerEmail && ['owner_email', 'email'].some((column) => {
      return String(salon[column] || '').trim().toLowerCase() === ownerEmail;
    });

    const phoneMatch = ownerPhone && ['owner_phone', 'phone', 'whatsapp', 'waNumber', 'phone_number'].some((column) => {
      const candidatePhone = normalizeDigits(salon[column]);
      return candidatePhone && (candidatePhone === ownerPhone || candidatePhone.endsWith(ownerPhone.slice(-10)));
    });

    return emailMatch || phoneMatch;
  });

  if (!candidate) {
    return {
      linked: false,
      message: 'No salon matched this owner contact yet. Add the same email or phone to the salon row and try again.'
    };
  }

  if (candidate.owner_id && candidate.owner_id !== user.id) {
    return {
      linked: false,
      message: 'This salon is already linked to another owner account.'
    };
  }

  const { data, error } = await client
    .from('salons')
    .update({ owner_id: user.id })
    .eq('id', candidate.id)
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return {
      linked: false,
      message: error?.message || 'The salon was found but could not be linked.'
    };
  }

  return { linked: true, salon: data };
}
