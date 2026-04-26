import type { Metadata } from 'next';
import { EditProfileScreen } from '../components/edit-profile-screen';

export const metadata: Metadata = {
  title: 'Edit Profile',
};

export default function ProfilePage() {
  return (
    <div className="max-w-md mx-auto w-full min-h-screen bg-white relative">
      <EditProfileScreen />
    </div>
  );
}
