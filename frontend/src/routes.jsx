import Home from './pages/Home.jsx';
import Cafes from './pages/Cafes.jsx';
import CafeDetail from './pages/CafeDetail.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Profile from './pages/Profile.jsx';
import OwnerDashboard from './pages/owners/OwnerDashboard.jsx';
import OwnerSettings from './pages/owners/OwnerSettings.jsx';

export default [
  { path: '/', element: Home },
  { path: '/cafes', element: Cafes },
  { path: '/cafes/:id', element: CafeDetail },
  { path: '/login', element: Login },
  { path: '/signup', element: Signup },
  { path: '/profile', element: Profile }
  ,{ path: '/owner', element: OwnerDashboard }
  ,{ path: '/owner/settings', element: OwnerSettings }
];

