import type { Metadata } from 'next';
import { EditProfileScreen } from '../components/edit-profile-screen';

export const metadata: Metadata = {
  title: 'Edit Profile',
};

export default function ProfilePage() {
  return (
    <div className="w-full max-w-sm mx-auto min-h-screen bg-white relative">
      <EditProfileScreen />
    </div>
  );
}
