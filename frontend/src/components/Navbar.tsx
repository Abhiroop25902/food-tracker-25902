import { Link } from 'react-router-dom';
import { type User } from 'firebase/auth';
import { PlusCircle, LayoutDashboard, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  user: User;
}

const Navbar = ({ user }: NavbarProps) => {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-indigo-600">Mindful Bites</Link>
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-1 text-gray-600 hover:text-indigo-600 transition">
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link to="/upload" className="flex items-center space-x-1 text-gray-600 hover:text-indigo-600 transition">
            <PlusCircle size={20} />
            <span>Add Meal</span>
          </Link>
          <Link to="/profile" className="flex items-center space-x-1 text-gray-600 hover:text-indigo-600 transition">
            <UserIcon size={20} />
            <span>Profile</span>
          </Link>
          <div className="flex items-center space-x-3 border-l pl-6 border-gray-200">
            <Link to="/profile">
              <img src={user.photoURL || ''} alt="User" className="w-8 h-8 rounded-full hover:ring-2 hover:ring-indigo-500 transition" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
