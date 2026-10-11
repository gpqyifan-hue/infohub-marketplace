import { useEffect, useState } from 'react';

const initialPosts = [
  {
    id: 1,
    author: '小李',
    type: '个人',
    title: '周末自营美食分享',
    content: '今天做了几道家常菜，欢迎来看看和交流。',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
    stats: { likes: 124, comments: 18 }
  },
  {
    id: 2,
    author: '西北小火锅馆',
    type: '商家',
    title: '招牌火锅套餐限时优惠',
    content: '秋季新品上线，支持在线预订，欢迎提前下单。',
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80',
    stats: { likes: 452, comments: 72 }
  }
];

const initialMerchants = [
  {
    id: 1,
    name: '西北小火锅馆',
    category: '餐饮',
    rating: 4.9,
    deliveryFee: '￥6',
    avgTime: '25~35 分钟'
  },
  {
    id: 2,
    name: '晨光咖啡屋',
    category: '咖啡',
    rating: 4.8,
    deliveryFee: '￥3',
    avgTime: '15~25 分钟'
  }
];

function App() {
  const [posts, setPosts] = useState(initialPosts);
  const [merchants, setMerchants] = useState(initialMerchants);
  const [orderSummary, setOrderSummary] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [postsResponse, merchantsResponse] = await Promise.all([
          fetch('/api/posts'),
          fetch('/api/merchants')
        ]);

        if (postsResponse.ok) {
          const data = await postsResponse.json();
          if (data.posts?.length) setPosts(data.posts);
        }

        if (merchantsResponse.ok) {
          const data = await merchantsResponse.json();
          if (data.merchants?.length) setMerchants(data.merchants);
        }
      } catch (error) {
        console.error('Load error:', error);
      }
    }

    loadData();
  }, []);

  async function placeOrder(merchantName) {
    const payload = {
      merchant: merchantName,
      item: '今日特价套餐',
      amount: 68,
      user: '游客用户'
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      setOrderSummary(`${merchantName} 订单已提交：${result.message}`);
    } catch (error) {
      setOrderSummary('订单提交失败，使用了本地演示模式');
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="logo">I</div>
          <div>
            <h1>InfoHub</h1>
            <small>个人信息中心 · 商户交易 · 互动社区</small>
          </div>
        </div>
        <nav>
          <a href="#feed">动态</a>
          <a href="#merchants">商户</a>
          <a href="#orders">订单</a>
        </nav>
      </header>

      <main className="content-grid">
        <section className="panel" id="feed">
          <div className="section-header">
            <h2>信息流</h2>
            <button>发布</button>
          </div>

          {posts.map((post) => (
            <article className="post-card" key={post.id}>
              <div className="post-meta">
                <span className="author">{post.author}</span>
                <span className="tag">{post.type}</span>
              </div>
              <h3>{post.title}</h3>
              <p>{post.content}</p>
              {post.image && <img src={post.image} alt={post.title} />}
              <div className="post-actions">
                <span>👍 {post.stats.likes}</span>
                <span>💬 {post.stats.comments}</span>
                <span>↗ 分享</span>
              </div>
            </article>
          ))}
        </section>

        <aside className="panel" id="merchants">
          <div className="section-header">
            <h2>商家与交易</h2>
          </div>

          {merchants.map((merchant) => (
            <div className="merchant-card" key={merchant.id}>
              <div>
                <h3>{merchant.name}</h3>
                <p>{merchant.category}</p>
              </div>
              <div className="merchant-meta">
                <span>⭐ {merchant.rating}</span>
                <span>{merchant.deliveryFee}</span>
                <span>{merchant.avgTime}</span>
              </div>
              <button onClick={() => placeOrder(merchant.name)}>下单</button>
            </div>
          ))}

          <div className="order-box" id="orders">
            <h3>订单状态</h3>
            <p>{orderSummary || '暂无订单'}</p>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
