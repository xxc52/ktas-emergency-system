import "./globals.css";

export const viewport = {
  width: 1024,
  height: 1024,
  initialScale: 1.0,
  userScalable: true,
};

export const metadata = {
  title: "KTAS 응급구조시스템 - 히포KU라테스",
  description: "응급구조대원을 위한 KTAS 응급도 분류 시스템",
  openGraph: {
    title: "KTAS 응급구조시스템 - 히포KU라테스",
    description: "응급구조대원을 위한 KTAS 응급도 분류 시스템",
    images: [
      {
        url: "/background.png",
        width: 1200,
        height: 630,
        alt: "KTAS 응급구조시스템",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KTAS 응급구조시스템 - 히포KU라테스",
    description: "응급구조대원을 위한 KTAS 응급도 분류 시스템",
    images: ["/background.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
