import Home from './pages/Home.jsx';
import Cafes from './pages/Cafes.jsx';
import CafeDetail from './pages/CafeDetail.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Profile from './pages/Profile.jsx';

export default [
  { path: '/', element: Home },
  { path: '/cafes', element: Cafes },
  { path: '/cafes/:id', element: CafeDetail },
  { path: '/login', element: Login },
  { path: '/signup', element: Signup },
  { path: '/profile', element: Profile }
];

