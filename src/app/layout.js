import "./globals.css";

export const metadata = {
  title: "KTAS 응급구조시스템 - 히포KU라테스",
  description: "응급구조대원을 위한 KTAS 응급도 분류 시스템",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        {children}
      </body>
    </html>
  );
}
