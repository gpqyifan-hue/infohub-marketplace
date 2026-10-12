import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {
  hashPassword,
  comparePassword,
  signToken,
  verifyToken,
  createUserRecord,
  findUserByUsername,
  getUserById,
  getUsersPublicProfile
} from './authStore.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const posts = [
  {
    id: 1,
    author: '小李',
    type: '个人',
    title: '周末自营美食分享',
    content: '今天做了几道家常菜，欢迎来看看和交流。',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
    stats: { likes: 124, comments: 18 },
    latitude: 31.2304,
    longitude: 121.4737,
    mediaType: 'image'
  },
  {
    id: 2,
    author: '西北小火锅馆',
    type: '商家',
    title: '招牌火锅套餐限时优惠',
    content: '秋季新品上线，支持在线预订，欢迎提前下单。',
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80',
    stats: { likes: 452, comments: 72 },
    latitude: 31.2304,
    longitude: 121.4837,
    mediaType: 'image'
  },
  {
    id: 3,
    author: '旅行笔记本',
    type: '个人',
    title: '成都美食地图游记',
    content: '成都认真吃一顿，周边美食都很有味道。',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
    stats: { likes: 312, comments: 40 },
    latitude: 30.5728,
    longitude: 104.0668,
    mediaType: 'image'
  }
];

const merchants = [
  {
    id: 1,
    name: '西北小火锅馆',
    category: '餐饮',
    rating: 4.9,
    deliveryFee: '￥6',
    avgTime: '25~35 分钟',
    latitude: 31.2304,
    longitude: 121.4837
  },
  {
    id: 2,
    name: '晨光咖啡屋',
    category: '咖啡',
    rating: 4.8,
    deliveryFee: '￥3',
    avgTime: '15~25 分钟',
    latitude: 31.2204,
    longitude: 121.4637
  },
  {
    id: 3,
    name: '川味私房菜',
    category: '川菜',
    rating: 4.7,
    deliveryFee: '￥8',
    avgTime: '20~30 分钟',
    latitude: 31.2404,
    longitude: 121.4737
  }
];

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = verifyToken(token);
    const user = getUserById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    req.user = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role
    };
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Center backend is running' });
});

app.post('/api/register', async (req, res) => {
  const { username, password, displayName, role } = req.body || {};

  if (!username || !password || !displayName) {
    return res.status(400).json({ message: 'username, password and displayName are required' });
  }

  if (findUserByUsername(username)) {
    return res.status(409).json({ message: 'Username already exists' });
  }

  const hashedPassword = await hashPassword(password);
  const user = createUserRecord({
    username,
    password: hashedPassword,
    displayName,
    role: role === 'merchant' ? 'merchant' : 'user'
  });

  const token = signToken(user);

  return res.status(201).json({
    message: 'User registered successfully',
    token,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role
    }
  });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: 'username and password are required' });
  }

  const user = findUserByUsername(username);
  if (!user) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  const isValid = await comparePassword(password, user.password);
  if (!isValid) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  const token = signToken(user);

  return res.json({
    message: 'Login success',
    token,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role
    }
  });
});

app.get('/api/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/users', requireAuth, (req, res) => {
  res.json({ users: getUsersPublicProfile() });
});

app.get('/api/posts', (req, res) => {
  res.json({ posts });
});

app.get('/api/search', (req, res) => {
  const keyword = (req.query.keyword || '').trim().toLowerCase();
  const radius = Number(req.query.radius || 10);
  const latitude = Number(req.query.latitude || 31.2304);
  const longitude = Number(req.query.longitude || 121.4737);

  const matches = posts.filter((post) => {
    const haystack = `${post.title} ${post.content} ${post.author} ${post.type}`.toLowerCase();
    const matchesKeyword = !keyword || haystack.includes(keyword);
    if (!matchesKeyword) return false;

    if (post.latitude && post.longitude) {
      const distance = haversineDistance(latitude, longitude, post.latitude, post.longitude);
      return distance <= radius;
    }

    return true;
  });

  const merchantMatches = merchants.filter((merchant) => {
    const haystack = `${merchant.name} ${merchant.category}`.toLowerCase();
    const matchesKeyword = !keyword || haystack.includes(keyword);
    if (!matchesKeyword) return false;

    if (merchant.latitude && merchant.longitude) {
      const distance = haversineDistance(latitude, longitude, merchant.latitude, merchant.longitude);
      return distance <= radius;
    }

    return true;
  });

  res.json({
    keyword,
    center: { latitude, longitude, radius },
    posts: matches,
    merchants: merchantMatches
  });
});

app.post('/api/posts', requireAuth, (req, res) => {
  const { title, content, type = '个人', image = null, mediaType = 'text', latitude, longitude } = req.body || {};

  if (!title || !content) {
    return res.status(400).json({ message: 'title and content are required' });
  }

  const newPost = {
    id: Date.now(),
    author: req.user.displayName,
    type: req.user.role === 'merchant' ? '商家' : type,
    title,
    content,
    image,
    mediaType,
    latitude: latitude !== undefined ? Number(latitude) : 31.2304,
    longitude: longitude !== undefined ? Number(longitude) : 121.4737,
    stats: { likes: 0, comments: 0 }
  };

  posts.unshift(newPost);
  return res.status(201).json({ message: 'Post created', post: newPost });
});

app.get('/api/merchants', (req, res) => {
  res.json({ merchants });
});

app.post('/api/orders', requireAuth, (req, res) => {
  const { merchant, item, amount } = req.body || {};

  if (!merchant || !item || !amount) {
    return res.status(400).json({ message: 'merchant, item and amount are required' });
  }

  return res.status(201).json({
    message: `订单创建成功，商家：${merchant}，金额：￥${amount}`,
    order: {
      merchant,
      item,
      amount,
      user: req.user.displayName,
      status: 'pending_payment'
    }
  });
});

app.listen(PORT, () => {
  console.log(`Center backend running on http://localhost:${PORT}`);
});
