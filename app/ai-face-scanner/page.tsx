import type { Metadata } from 'next';
import { AIFaceScannerScreen } from '../components/ai-face-scanner-screen';

export const metadata: Metadata = {
  title: 'AI Face Scanner',
};

export default function AIFaceScannerPage() {
  return <AIFaceScannerScreen />;
}
