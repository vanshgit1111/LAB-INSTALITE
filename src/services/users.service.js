import prisma from "../db.js";

export async function createUser(data) {
  return await prisma.user.create({
    data,
  });
}

export async function listUsers({ where = {}, orderBy, skip, take } = {}) {
  const [total, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy,
      skip,
      take,
    }),
  ]);

  return { total, users };
}

export async function getUserById(id) {
  return await prisma.user.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          posts: true,
          likes: true,
        },
      },
    },
  });
}

export async function updateUser(id, data) {
  return await prisma.user.update({
    where: { id },
    data,
    include: {
      _count: {
        select: {
          posts: true,
          likes: true,
        },
      },
    },
  });
}

export async function deleteUser(id) {
  return await prisma.user.delete({
    where: { id },
  });
}
