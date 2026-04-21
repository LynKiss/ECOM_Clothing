import { useEffect, useState, type CSSProperties } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Share2, ArrowRight } from 'lucide-react';
import { clientApi } from '../../lib/client-api';

type NewsDetail = {
  _id: string;
  title: string;
  subTitle?: string;
  slug: string;
  titleImageUrl?: string;
  content?: string;
  isPublished: boolean;
  createdAt: string;
  author?: { username: string; fullName?: string };
};

type RelatedNews = {
  _id: string;
  title: string;
  slug: string;
  titleImageUrl?: string;
  createdAt: string;
};

export default function NewsDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [article, setArticle] = useState<NewsDetail | null>(null);
  const [related, setRelated] = useState<RelatedNews[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    // Try to find by slug via news list
    void clientApi
      .get<{ items?: NewsDetail[] } | NewsDetail[]>(`/news?slug=${slug}&limit=1`)
      .then(async (data) => {
        const item = Array.isArray(data) ? data[0] : data.items?.[0];
        if (!item) { void navigate('/client/news'); return; }
        setArticle(item);

        // Fetch related (latest excluding this)
        const rel = await clientApi
          .get<{ items?: RelatedNews[] } | RelatedNews[]>('/news?limit=4&status=published')
          .catch(() => [] as RelatedNews[]);
        const relItems = Array.isArray(rel) ? rel : (rel.items ?? []);
        setRelated(relItems.filter((r) => r._id !== item._id).slice(0, 3));
      })
      .catch(() => { void navigate('/client/news'); })
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  if (loading) {
    return (
      <div style={{ background: '#f2f0eb', minHeight: '60vh' }} className="flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#006241] border-t-transparent" />
      </div>
    );
  }

  if (!article) return null;

  const authorName = article.author?.fullName ?? article.author?.username ?? 'Ban biên tập';

  return (
    <div style={{ background: '#f2f0eb', minHeight: '80vh' }}>
      {/* Hero image */}
      {article.titleImageUrl && (
        <div className="relative h-64 overflow-hidden md:h-96" style={{ background: '#1E3932' }}>
          <img
            src={article.titleImageUrl}
            alt={article.title}
            className="h-full w-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent" />
        </div>
      )}

      <div className="mx-auto max-w-4xl px-4 py-10 lg:px-6">
        {/* Back */}
        <Link
          to="/client/news"
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-[#006241] hover:underline"
        >
          <ArrowLeft size={15} /> Quay lại tin tức
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          {/* Main article */}
          <article className="rounded-2xl bg-white p-8 shadow-sm">
            <div className="mb-4 flex items-center gap-3 text-xs text-gray-400">
              <Calendar size={13} />
              {new Date(article.createdAt).toLocaleDateString('vi-VN', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
              <span>·</span>
              <span>{authorName}</span>
            </div>

            <h1 className="text-3xl font-black leading-tight text-[#1E3932]">{article.title}</h1>
            {article.subTitle && (
              <p className="mt-3 text-base leading-relaxed text-gray-500">{article.subTitle}</p>
            )}

            <div className="my-6 h-px bg-black/5" />

            {article.content ? (
              <div
                className="prose prose-green max-w-none text-sm leading-relaxed text-gray-700"
                style={{
                  '--tw-prose-headings': '#1E3932',
                  '--tw-prose-links': '#006241',
                } as CSSProperties}
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            ) : (
              <p className="italic text-gray-400">Nội dung đang được cập nhật...</p>
            )}

            <div className="mt-8 flex items-center gap-3 border-t border-black/5 pt-6">
              <button
                onClick={() => navigator.share?.({ title: article.title, url: window.location.href }).catch(() => {})}
                className="flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-gray-500 transition hover:border-[#006241] hover:text-[#006241]"
              >
                <Share2 size={13} /> Chia sẻ
              </button>
            </div>
          </article>

          {/* Sidebar */}
          <aside>
            {related.length > 0 && (
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-black uppercase tracking-wider text-gray-400">
                  Bài viết liên quan
                </h3>
                <div className="space-y-4">
                  {related.map((r) => (
                    <Link
                      key={r._id}
                      to={`/client/news/${r.slug}`}
                      className="group flex items-start gap-3"
                    >
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#d4e9e2]">
                        {r.titleImageUrl ? (
                          <img
                            src={r.titleImageUrl}
                            alt={r.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xl">🌿</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="line-clamp-2 text-sm font-semibold leading-snug text-[#1E3932] group-hover:text-[#006241]">
                          {r.title}
                        </p>
                        <p className="mt-1 text-[11px] text-gray-400">
                          {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link
                  to="/client/news"
                  className="mt-4 flex items-center gap-1 text-xs font-bold text-[#006241] hover:underline"
                >
                  Xem tất cả tin tức <ArrowRight size={12} />
                </Link>
              </div>
            )}

            {/* Newsletter */}
            <div
              className="mt-4 rounded-2xl p-5 text-center"
              style={{ background: '#1E3932' }}
            >
              <span className="text-3xl">📬</span>
              <h3 className="mt-3 font-black text-white">Nhận tin mới nhất</h3>
              <p className="mt-1 text-xs text-white/60">Cập nhật kiến thức nông nghiệp mỗi tuần.</p>
              <input
                type="email"
                placeholder="Email của bạn..."
                className="mt-3 w-full rounded-full bg-white/10 px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none focus:bg-white/20"
              />
              <button
                className="mt-2 w-full rounded-full py-2.5 text-sm font-bold text-white"
                style={{ background: '#00754A' }}
              >
                Đăng ký
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
