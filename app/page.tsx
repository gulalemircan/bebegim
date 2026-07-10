import dynamic from 'next/dynamic';

const AppShell = dynamic(() => import('./components/app-shell'), { ssr: false });
const NotificationToast = dynamic(() => import('./components/notification-toast'), { ssr: false });

export default function Home() {
  // Not: playerName normalde Login sayfasından veya localStorage'dan alınır.
  // NotificationToast'un düzgün çalışması için "Efsun" veya "Emircan" olarak state'e bağlanması gerekir.
  // Şimdilik sistemin çalışması için temel yapı kuruldu.
  return (
    <main>
      <AppShell />
      {/* localStorage'dan ismi çekecek bir yapı NotificationToast içinde mevcuttur */}
      <NotificationToast playerName={typeof window !== 'undefined' ? (localStorage.getItem('ee_player_name') || 'Misafir') : 'Misafir'} />
    </main>
  );
}
