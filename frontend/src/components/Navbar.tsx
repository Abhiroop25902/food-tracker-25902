import { Link } from 'react-router-dom';
import { auth } from '../firebase';
import { type User } from 'firebase/auth';
import { LogOut, PlusCircle, LayoutDashboard } from 'lucide-react';

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
          <div className="flex items-center space-x-3 border-l pl-6 border-gray-200">
            <img src={user.photoURL || ''} alt="User" className="w-8 h-8 rounded-full" />
            <button 
              onClick={() => auth.signOut()}
              className="text-gray-600 hover:text-red-500 transition"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
