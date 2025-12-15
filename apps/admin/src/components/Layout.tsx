import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { removeToken } from '../utils/api';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <aside className="w-64 bg-white shadow-sm min-h-screen flex flex-col">
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold text-gray-900">管理后台</h1>
          </div>
          <nav className="p-4 flex-1">
            <ul className="space-y-2">
              <li>
                <Link
                  to="/prompts"
                  className={`block px-4 py-2 rounded-md ${
                    isActive('/prompts')
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Prompt管理
                </Link>
              </li>
            </ul>
          </nav>
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
            >
              退出登录
            </button>
          </div>
        </aside>
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

