'use client';

import { useEffect } from 'react';

/**
 * 모바일 디바이스 감지 및 Viewport 관리
 * - 500px 미만: 태블릿 뷰포트(1024px) 강제 + mobile-mode 클래스 추가
 * - 500px 이상: 정상 반응형
 */
export default function MobileViewportManager() {
  useEffect(() => {
    const MOBILE_THRESHOLD = 500;
    const TABLET_WIDTH = 1024;

    const setResponsiveViewport = () => {
      // viewport meta tag 가져오기
      let viewport = document.querySelector('meta[name="viewport"]');

      // 없으면 생성
      if (!viewport) {
        viewport = document.createElement('meta');
        viewport.name = 'viewport';
        document.head.appendChild(viewport);
      }

      if (window.innerWidth < MOBILE_THRESHOLD) {
        // 모바일: 태블릿 뷰포트 강제
        viewport.content = `width=${TABLET_WIDTH}, initial-scale=1, minimum-scale=0.5, maximum-scale=3, user-scalable=yes`;
        document.body.classList.add('mobile-mode');
        console.log(`[Viewport] 모바일 감지 (${window.innerWidth}px) → 태블릿 모드 강제 (${TABLET_WIDTH}px)`);
      } else {
        // 태블릿/데스크톱: 정상
        viewport.content = 'width=device-width, initial-scale=1';
        document.body.classList.remove('mobile-mode');
        console.log(`[Viewport] 태블릿/데스크톱 감지 (${window.innerWidth}px) → 정상 모드`);
      }
    };

    // 초기 로드
    setResponsiveViewport();

    // 화면 회전/리사이즈 시 재체크
    window.addEventListener('resize', setResponsiveViewport);
    window.addEventListener('orientationchange', setResponsiveViewport);

    return () => {
      window.removeEventListener('resize', setResponsiveViewport);
      window.removeEventListener('orientationchange', setResponsiveViewport);
    };
  }, []);

  return null; // UI 없는 컴포넌트
}
