import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Home,
  Layers,
  Box,
  Users,
  Flower2,
  Building2,
  ArrowRightLeft,
  FileText,
  UserCog,
  LogOut,
  Menu,
  X,
  FileDown,
  FileUp,
  Search
} from 'lucide-react';

export default function Layout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const menuItems = [
    { 
      name: 'Dashboard', 
      path: '/', 
      icon: Home, 
      roles: ['admin', 'supervisor', 'operator'] 
    },
    { 
      name: 'Batches', 
      path: '/batches', 
      icon: Layers, 
      roles: ['admin', 'supervisor', 'operator'] 
    },
    { 
      name: 'Batch Tracking', 
      path: '/batch-tracking', 
      icon: Search, 
      roles: ['admin', 'supervisor', 'operator'] 
    },
    { 
      name: 'Containers', 
      path: '/containers', 
      icon: Box, 
      roles: ['admin', 'supervisor', 'operator'] 
    },
    { 
      name: 'Phase Movement', 
      path: '/phase-management', 
      icon: ArrowRightLeft, 
      roles: ['admin', 'supervisor', 'operator'] 
    },
    { 
      name: 'Greenhouses', 
      path: '/greenhouses', 
      icon: Building2, 
      roles: ['admin', 'supervisor'] 
    },
    { 
      name: 'Suppliers', 
      path: '/suppliers', 
      icon: Users, 
      roles: ['admin', 'supervisor'] 
    },
    { 
      name: 'Varieties', 
      path: '/varieties', 
      icon: Flower2, 
      roles: ['admin', 'supervisor'] 
    },
    { 
      name: 'Export Data', 
      path: '/export', 
      icon: FileDown, 
      roles: ['admin', 'supervisor', 'operator'] 
    },
    { 
      name: 'Import Data', 
      path: '/import', 
      icon: FileUp, 
      roles: ['admin', 'supervisor'] 
    },
    { 
      name: 'Users', 
      path: '/users', 
      icon: UserCog, 
      roles: ['admin'] 
    },
  ];

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role || 'operator')
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-white shadow-md text-gray-600 hover:text-gray-900"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out flex flex-col
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:relative lg:flex-shrink-0
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b bg-green-600 flex-shrink-0">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Flower2 className="w-7 h-7" />
            Orchid System
          </h1>
        </div>

        {/* User Info */}
        <div className="p-4 border-b bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-600 font-semibold text-lg">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{user?.username || 'User'}</p>
              <p className="text-sm text-gray-500 capitalize">{user?.role || 'operator'}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${active 
                    ? 'bg-green-50 text-green-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-green-600' : ''}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t bg-white flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 flex-shrink-0">
          <div className="lg:hidden w-10" /> {/* Spacer for mobile menu button */}
          
          <div className="flex-1 lg:flex-none">
            <h2 className="text-lg font-semibold text-gray-800">
              {filteredMenuItems.find(item => isActive(item.path))?.name || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-700">{user?.username}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
