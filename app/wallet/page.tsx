import type { Metadata } from 'next';
import { WalletScreen } from '../components/wallet-screen';

export const metadata: Metadata = {
  title: 'Wallet',
};

export default function WalletPage() {
  return (
    <div className="w-full max-w-sm mx-auto min-h-screen bg-white relative">
      <WalletScreen />
    </div>
  );
}
