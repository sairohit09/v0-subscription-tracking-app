import { useAuth, useUser, UserButton } from '@clerk/clerk-react'
import { LogOut } from 'lucide-react'
import './UserMenu.css'

export default function UserMenu() {
  const { user } = useUser()
  const { signOut } = useAuth()

  return (
    <div className="user-menu">
      <div className="user-info">
        <span className="user-name">{user?.firstName || 'User'}</span>
        <span className="user-email">{user?.primaryEmailAddress?.emailAddress}</span>
      </div>
      <UserButton afterSignOutUrl="/login" />
    </div>
  )
}
