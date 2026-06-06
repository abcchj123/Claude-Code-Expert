// globals.css의 body overflow:hidden을 재정의 — 프리뷰 페이지는 전체 스크롤 필요
export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, overflowY: 'auto', background: '#F8FAFC' }}>
      {children}
    </div>
  );
}
