'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/profile');
  }, [router]);

  return (
    <div className="container">
      <div className="content" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <h1 className="title">KTAS 응급구조시스템</h1>
        <p style={{ fontSize: '18px', color: '#666', marginTop: '20px' }}>
          히포KU라테스
        </p>
      </div>
    </div>
  );
}
