import { ToastProvider } from '@/components/Toast';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useRouter } from '@/lib/router';
import { HomePage } from '@/pages/HomePage';
import { ExplorePage } from '@/pages/ExplorePage';
import { TurfDetailPage } from '@/pages/TurfDetailPage';
import { BookingPage } from '@/pages/BookingPage';
import { DashboardPage } from '@/pages/DashboardPage';

function AppContent() {
  const { route } = useRouter();
  const path = route.path.split('?')[0];

  let page;
  if (path === '/' || path === '') {
    page = <HomePage />;
  } else if (path === '/explore') {
    page = <ExplorePage />;
  } else if (path.startsWith('/turf/')) {
    page = <TurfDetailPage />;
  } else if (path === '/booking') {
    page = <BookingPage />;
  } else if (path === '/dashboard') {
    page = <DashboardPage />;
  } else {
    page = <HomePage />;
  }

  // Don't show navbar/footer on booking confirmation area (still show navbar though)
  const showFooter = path !== '/booking';

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{page}</main>
      {showFooter && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
