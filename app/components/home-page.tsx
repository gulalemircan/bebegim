// ... (üst kısımlar aynı)
function getNextMonthly(baseDate: Date, now: Date) {
  const nextMonth = new Date(now.getFullYear(), now.getMonth(), baseDate.getDate());
  if (now > nextMonth) nextMonth.setMonth(nextMonth.getMonth() + 1);
  // HATA DÜZELTİLDİ: 8640000 -> 86400000
  const diffDays = Math.ceil((nextMonth.getTime() - now.getTime()) / 86400000);
  const monthCount = (nextMonth.getFullYear() - baseDate.getFullYear()) * 12 + (nextMonth.getMonth() - baseDate.getMonth());
  return { daysLeft: diffDays, monthCount };
}

export default function HomePage({ playerName, onNavigate }: HomePageProps) {
  // ... (state ve useEffect kısımları aynı)

  // Titreşim fonksiyonu eklendi
  const vibrate = () => {
    if (typeof window !== 'undefined' && window.navigator.vibrate) {
      window.navigator.vibrate(30);
    }
  };

  const handleNavigate = (id: PageId) => {
    vibrate(); // Butona basınca titret
    onNavigate(id);
  };

  // ... (handleSetMood içinde de vibrate() kullanabilirsin)

  // JSX içinde onNavigate yerine handleNavigate kullanıyoruz:
  // Örnek: <button onClick={() => handleNavigate(item.id)}> ...
