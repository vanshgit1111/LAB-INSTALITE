import prisma from "../src/db.js";
import { users, posts, likes } from "./seed-data.js";

async function main() {
  // 1. Delete all rows from all three tables. Children first: likes, then posts, then users
  await prisma.like.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create all users in one query, getting created rows back
  const userData = users.map((u) => ({
    username: u.username,
    email: u.email,
    fullname: u.fullname,
    bio: u.bio,
    isPrivate: u.isPrivate,
    createdAt: new Date(u.createdAt),
  }));
  const createdUsers = await prisma.user.createManyAndReturn({
    data: userData,
  });

  // 3. Build lookup: username -> id
  const userLookup = new Map();
  for (const user of createdUsers) {
    userLookup.set(user.username, user.id);
  }

  // 4. Create all posts in one query, replacing author with authorId
  const postData = posts.map((p) => {
    const authorId = userLookup.get(p.author);
    if (!authorId) {
      throw new Error(`Author not found for username: ${p.author}`);
    }
    return {
      imageUrl: p.imageUrl,
      caption: p.caption,
      location: p.location,
      createdAt: new Date(p.createdAt),
      authorId,
    };
  });
  const createdPosts = await prisma.post.createManyAndReturn({
    data: postData,
  });

  // 5. Build lookup: insta## -> post id
  const postLookup = new Map();
  for (const post of createdPosts) {
    const instaKey = post.imageUrl.split("/")[4];
    postLookup.set(instaKey, post.id);
  }

  // 6. Create all likes in one query (real userId and postId)
  const likeData = likes.map((l) => {
    const userId = userLookup.get(l.user);
    const postId = postLookup.get(l.post);
    if (!userId) throw new Error(`User not found for username: ${l.user}`);
    if (!postId) throw new Error(`Post not found for key: ${l.post}`);
    return {
      userId,
      postId,
    };
  });
  const createdLikes = await prisma.like.createManyAndReturn({
    data: likeData,
  });

  // 7. Print seeded counts
  console.log(
    `🌱 Seeded ${createdUsers.length} users, ${createdPosts.length} posts and ${createdLikes.length} likes`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
