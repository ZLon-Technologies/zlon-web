import type { Metadata } from 'next';
import { WalletScreen } from '../components/wallet-screen';

export const metadata: Metadata = {
  title: 'Wallet',
};

export default function WalletPage() {
  return (
    <div className="max-w-md mx-auto w-full min-h-screen bg-white relative">
      <WalletScreen />
    </div>
  );
}
