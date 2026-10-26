import prisma from "../db.js";

export async function createLike(userId, postId) {
  return await prisma.like.create({
    data: {
      userId,
      postId,
    },
  });
}

export async function deleteLike(userId, postId) {
  return await prisma.like.delete({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
  });
}

export async function getLikesByPostId(postId) {
  return await prisma.user.findMany({
    where: {
      likes: {
        some: {
          postId,
        },
      },
    },
    select: {
      id: true,
      username: true,
      fullname: true,
    },
    orderBy: {
      username: "asc",
    },
  });
}
