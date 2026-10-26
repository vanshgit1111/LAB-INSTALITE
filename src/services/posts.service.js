import prisma from "../db.js";

export async function createPost(data) {
  return await prisma.post.create({
    data,
    include: {
      author: {
        select: {
          id: true,
          username: true,
          fullname: true,
        },
      },
      _count: {
        select: {
          likes: true,
        },
      },
    },
  });
}

export async function listPosts({ where = {}, orderBy, skip, take }) {
  const [total, posts] = await prisma.$transaction([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullname: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    }),
  ]);

  return { total, posts };
}

export async function getPostById(id) {
  return await prisma.post.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          fullname: true,
        },
      },
      _count: {
        select: {
          likes: true,
        },
      },
    },
  });
}

export async function updatePost(id, data) {
  return await prisma.post.update({
    where: { id },
    data,
    include: {
      author: {
        select: {
          id: true,
          username: true,
          fullname: true,
        },
      },
      _count: {
        select: {
          likes: true,
        },
      },
    },
  });
}

export async function deletePost(id) {
  return await prisma.post.delete({
    where: { id },
  });
}

export async function getUserPosts(authorId, { skip, take }) {
  const where = { authorId };
  const [total, posts] = await prisma.$transaction([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        _count: {
          select: {
            likes: true,
          },
        },
      },
    }),
  ]);

  return { total, posts };
}

export async function getUserLikedPosts(userId, { skip, take }) {
  const where = {
    likes: {
      some: {
        userId,
      },
    },
  };

  const [total, posts] = await prisma.$transaction([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullname: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    }),
  ]);

  return { total, posts };
}
