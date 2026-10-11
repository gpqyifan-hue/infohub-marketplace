import { useEffect, useMemo, useState } from 'react';

function App() {
  const [screen, setScreen] = useState('feed');
  const [authMode, setAuthMode] = useState('login');
  const [token, setToken] = useState(localStorage.getItem('infohub_token') || '');
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('infohub_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [form, setForm] = useState({ username: '', password: '', displayName: '', role: 'user' });
  const [posts, setPosts] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [orderSummary, setOrderSummary] = useState('');
  const [message, setMessage] = useState('');

  const isLoggedIn = useMemo(() => Boolean(token && user), [token, user]);

  useEffect(() => {
    loadData();
  }, []);

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

  async function handleAuthSubmit(event) {
    event.preventDefault();
    const url = authMode === 'login' ? '/api/login' : '/api/register';

    try {
      const payload = {
        username: form.username,
        password: form.password,
        ...(authMode === 'register' ? { displayName: form.displayName, role: form.role } : {})
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok) {
        setMessage(result.message || '认证失败');
        return;
      }

      localStorage.setItem('infohub_token', result.token);
      localStorage.setItem('infohub_user', JSON.stringify(result.user));
      setToken(result.token);
      setUser(result.user);
      setMessage(authMode === 'login' ? '登录成功' : '注册成功');
      setScreen('feed');
    } catch (error) {
      setMessage('认证服务暂时不可用');
    }
  }

  async function handleCreatePost(event) {
    event.preventDefault();
    const title = event.target.title.value;
    const content = event.target.content.value;
    const type = event.target.type.value;

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title, content, type })
      });

      const result = await response.json();
      if (!response.ok) {
        setMessage(result.message || '发布失败');
        return;
      }

      setPosts((prev) => [result.post, ...prev]);
      setMessage('发布成功');
      event.target.reset();
    } catch (error) {
      setMessage('发布失败，稍后重试');
    }
  }

  async function placeOrder(merchantName) {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ merchant: merchantName, item: '今日特价套餐', amount: 68 })
      });

      const result = await response.json();
      if (!response.ok) {
        setOrderSummary(result.message || '订单失败');
        return;
      }

      setOrderSummary(`${merchantName}：${result.message}`);
    } catch (error) {
      setOrderSummary('订单提交失败，请检查登录状态');
    }
  }

  function logout() {
    localStorage.removeItem('infohub_token');
    localStorage.removeItem('infohub_user');
    setToken('');
    setUser(null);
    setScreen('feed');
    setMessage('已退出登录');
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
          <button className="nav-button" onClick={() => setScreen('feed')}>动态</button>
          <button className="nav-button" onClick={() => setScreen('merchants')}>商户</button>
          {isLoggedIn ? (
            <>
              <span className="welcome-text">欢迎，{user.displayName}</span>
              <button className="nav-button" onClick={logout}>退出</button>
            </>
          ) : (
            <button className="nav-button" onClick={() => setScreen('auth')}>登录 / 注册</button>
          )}
        </nav>
      </header>

      {message && <div className="message-banner">{message}</div>}

      <main className="content-grid">
        {screen === 'auth' && !isLoggedIn && (
          <section className="panel auth-panel">
            <div className="section-header">
              <h2>{authMode === 'login' ? '登录' : '注册'}</h2>
              <div className="toggle-group">
                <button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>登录</button>
                <button className={authMode === 'register' ? 'active' : ''} onClick={() => setAuthMode('register')}>注册</button>
              </div>
            </div>

            <form onSubmit={handleAuthSubmit} className="auth-form">
              {authMode === 'register' && (
                <>
                  <label>
                    显示名
                    <input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
                  </label>
                  <label>
                    角色
                    <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                      <option value="user">个人用户</option>
                      <option value="merchant">商家</option>
                    </select>
                  </label>
                </>
              )}

              <label>
                用户名
                <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
              </label>

              <label>
                密码
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </label>

              <button type="submit">{authMode === 'login' ? '登录' : '创建账户'}</button>
            </form>
          </section>
        )}

        {screen !== 'auth' && (
          <>
            <section className="panel" id="feed">
              <div className="section-header">
                <h2>信息流</h2>
                {isLoggedIn ? <button onClick={() => setScreen('publish')}>发布内容</button> : <button onClick={() => setScreen('auth')}>登录发布</button>}
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
                  <button onClick={() => placeOrder(merchant.name)} disabled={!isLoggedIn}>下单</button>
                </div>
              ))}

              <div className="order-box" id="orders">
                <h3>订单状态</h3>
                <p>{orderSummary || '暂无订单'}</p>
              </div>
            </aside>
          </>
        )}

        {screen === 'publish' && isLoggedIn && (
          <section className="panel publish-panel">
            <div className="section-header">
              <h2>发布内容</h2>
              <button onClick={() => setScreen('feed')}>返回</button>
            </div>

            <form className="publish-form" onSubmit={handleCreatePost}>
              <label>
                标题
                <input name="title" placeholder="例如：推荐一家本地小店" />
              </label>
              <label>
                类型
                <select name="type">
                  <option value="个人">个人</option>
                  <option value="商家">商家</option>
                </select>
              </label>
              <label>
                内容
                <textarea name="content" rows="6" placeholder="分享你的信息、经验或经营内容..." />
              </label>
              <button type="submit">发布</button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
