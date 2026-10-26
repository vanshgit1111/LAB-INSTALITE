import prisma from "../db.js";

export async function createPost(data) {
  return await prisma.post.create({
    data,
  });
}

export async function listPosts() {
  return await prisma.post.findMany();
}

export async function getPostById(id) {
  return await prisma.post.findUnique({
    where: { id },
  });
}

export async function updatePost(id, data) {
  return await prisma.post.update({
    where: { id },
    data,
  });
}

export async function deletePost(id) {
  return await prisma.post.delete({
    where: { id },
  });
}
