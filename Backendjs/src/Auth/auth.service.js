import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";
import { AppError } from "../utils/AppError.js";


const generateToken = (user) => {
  return jwt.sign(
    { id: Number(user.id), email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

export const registerUser = async ({
  username,
  email,
  password,
  age,
  avatarUrl,
  bannerUrl,
}) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError("Email already registered", 409);

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      age,
      avatarUrl,
      bannerUrl,
    },
  });

  const safeUser = {
    id: Number(user.id), // ✅ BigInt fixed
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    bannerUrl: user.bannerUrl,
    age: user.age,
  };

  return {
    token: generateToken(user),
    user: safeUser,
  };
};




export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password)  throw new AppError("Invalid credentials", 401);


  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new AppError("Invalid credentials", 401);

  return generateToken(user);
};

export const oauthLogin = async ({ email, username, avatarUrl }) => {
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        username,
        avatarUrl,
        password: null,
      },
    });
  }

  return generateToken(user);
};
