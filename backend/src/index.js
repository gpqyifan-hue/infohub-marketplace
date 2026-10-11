import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

const posts = [
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

const merchants = [
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

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'InfoHub backend is running' });
});

app.get('/api/posts', (req, res) => {
  res.json({ posts });
});

app.post('/api/posts', (req, res) => {
  const { author, title, content, type = '个人' } = req.body;

  if (!author || !title || !content) {
    return res.status(400).json({ message: 'author, title and content are required' });
  }

  const newPost = {
    id: Date.now(),
    author,
    type,
    title,
    content,
    image: null,
    stats: { likes: 0, comments: 0 }
  };

  posts.unshift(newPost);
  return res.status(201).json({ message: 'Post created', post: newPost });
});

app.get('/api/merchants', (req, res) => {
  res.json({ merchants });
});

app.post('/api/orders', (req, res) => {
  const { merchant, item, amount, user } = req.body;

  if (!merchant || !item || !amount || !user) {
    return res.status(400).json({ message: 'merchant, item, amount and user are required' });
  }

  return res.status(201).json({
    message: `订单创建成功，商家：${merchant}，金额：￥${amount}`,
    order: {
      merchant,
      item,
      amount,
      user,
      status: 'pending_payment'
    }
  });
});

app.listen(PORT, () => {
  console.log(`InfoHub backend running on http://localhost:${PORT}`);
});
