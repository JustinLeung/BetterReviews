import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { HomePage } from './pages/HomePage';
import { PlaceDetailPage } from './pages/PlaceDetailPage';
import { SavedPage } from './pages/SavedPage';

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/places/:id', element: <PlaceDetailPage /> },
      { path: '/saved', element: <SavedPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

function NotFound() {
  return (
    <div className="page">
      <h1 className="page__title">Not found</h1>
      <p className="muted">That page doesn't exist.</p>
    </div>
  );
}

export function App() {
  return <RouterProvider router={router} />;
}
