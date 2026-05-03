import type { Metadata } from 'next';
import { WalletScreen } from '../components/wallet-screen';

export const metadata: Metadata = {
  title: 'Wallet',
};

export default function WalletPage() {
  return (
    <div className="w-full relative">
      <WalletScreen />
    </div>
  );
}
