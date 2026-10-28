export default function Loading() {
  return <div role="status" aria-label="Đang tải nội dung" className="max-w-2xl mx-auto p-4 space-y-5">{[1, 2, 3].map(item => <div key={item} className="social-card space-y-4 animate-pulse"><div className="w-12 h-12 bg-cream-200 rounded-full" /><div className="h-4 bg-cream-100 rounded-xl w-2/3" /><div className="h-44 bg-cream-100 rounded-2xl" /></div>)}</div>;
}
