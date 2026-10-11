import { default as bcryptjs } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';
const users = [];

export function hashPassword(password) {
  return bcryptjs.hash(password, 10);
}

export function comparePassword(password, hash) {
  return bcryptjs.compare(password, hash);
}

export function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      displayName: user.displayName
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function createUserRecord({ username, password, displayName, role = 'user' }) {
  const user = {
    id: String(Date.now() + Math.random()),
    username,
    password,
    displayName,
    role,
    createdAt: new Date().toISOString()
  };

  users.push(user);
  return user;
}

export function findUserByUsername(username) {
  return users.find((user) => user.username === username);
}

export function getUserById(id) {
  return users.find((user) => user.id === id);
}

export function getUsersPublicProfile() {
  return users.map((user) => ({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    createdAt: user.createdAt
  }));
}
