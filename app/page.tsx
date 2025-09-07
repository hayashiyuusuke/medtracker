// app/page.tsx
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">
          MedTrackerへようこそ
        </h1>
        <Link href="/medications/new" className="btn btn-primary">
          新しいお薬を登録する
        </Link>
      </div>
    </main>
  );
}