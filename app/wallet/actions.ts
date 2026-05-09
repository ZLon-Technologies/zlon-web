'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

export async function rechargeWallet(amount: number) {
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return { ok: false, message: 'You must be logged in to recharge your wallet.' };
  }

  const userId = authData.user.id;

  // Fetch current balance
  const { data: walletData, error: walletFetchError } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', userId)
    .maybeSingle();

  if (walletFetchError && walletFetchError.code !== '42703' && !walletFetchError.message.includes('user_id')) {
    return { ok: false, message: 'Failed to fetch wallet balance.' };
  }

  const currentBalance = walletData?.balance || 0;
  const newBalance = currentBalance + amount;

  const { error: walletUpdateError } = await supabase
    .from('wallets')
    .upsert({ user_id: userId, balance: newBalance, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (walletUpdateError) {
    return { ok: false, message: 'Failed to update wallet balance.' };
  }

  revalidatePath('/wallet');
  
  return { ok: true, message: 'Recharge successful.' };
}
