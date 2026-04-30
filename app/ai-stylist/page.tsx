import type { Metadata } from 'next';
import { AIFaceScannerScreen } from '../components/ai-face-scanner-screen';

export const metadata: Metadata = {
  title: 'AI Stylist',
};

export default function AIStylistPage() {
  return <AIFaceScannerScreen />;
}
