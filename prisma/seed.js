import prisma from "../src/db.js";
import { users, posts } from "./seed-data.js";

async function main() {
  // 1. Delete all rows — children first (likes → posts → users)
  await prisma.like.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create all 12 users in one query
  const createdUsers = await prisma.user.createManyAndReturn({
    data: users.map((u) => ({
      username:  u.username,
      email:     u.email,
      fullname:  u.fullname,
      bio:       u.bio ?? null,
      isPrivate: u.isPrivate,
      createdAt: new Date(u.createdAt),
    })),
  });

  // 3. Build username → id lookup
  const userLookup = new Map(createdUsers.map((u) => [u.username, u.id]));

  // 4. Create all 24 posts in one query
  const createdPosts = await prisma.post.createManyAndReturn({
    data: posts.map((p) => {
      const authorId = userLookup.get(p.author);
      if (!authorId) throw new Error(`Author not found: ${p.author}`);
      return {
        imageUrl:  p.imageUrl,
        caption:   p.caption ?? null,
        location:  p.location ?? null,
        createdAt: new Date(p.createdAt),
        authorId,
      };
    }),
  });

  // 5. Print counts from what was actually created
  console.log(
    `🌱 Seeded ${createdUsers.length} users and ${createdPosts.length} posts`
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
