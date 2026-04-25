import type { Metadata } from 'next';
import { EditProfileScreen } from '../components/edit-profile-screen';

export const metadata: Metadata = {
  title: 'Edit Profile',
};

export default function ProfilePage() {
  return <EditProfileScreen />;
}
