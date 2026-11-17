import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import OfferingDetail from './pages/OfferingDetail';
import MyClasses from './pages/MyClasses';
import MyOfferings from './pages/MyOfferings';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="ingresar" element={<Login />} />
        <Route path="registro" element={<Register />} />
        <Route path="verificar-email" element={<VerifyEmail />} />
        <Route path="olvide-mi-clave" element={<ForgotPassword />} />
        <Route path="restablecer" element={<ResetPassword />} />
        <Route path="ofertas/:id" element={<OfferingDetail />} />

        <Route element={<ProtectedRoute />}>
          <Route path="mis-clases" element={<MyClasses />} />
          <Route path="dar-clases" element={<MyOfferings />} />
          <Route path="perfil" element={<Profile />} />
          <Route path="usuarios/:id" element={<UserProfile />} />
        </Route>

        <Route element={<ProtectedRoute roles={['ADMIN']} />}>
          <Route path="admin" element={<Admin />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
