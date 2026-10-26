import * as postsService from "../services/posts.service.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";

export async function create(req, res) {
  const { imageUrl, authorId, caption, location } = req.body || {};

  if (!imageUrl || authorId === undefined || authorId === null) {
    return res.status(400).json({ error: "imageUrl and authorId are required" });
  }

  const parsedAuthorId = parseInt(authorId, 10);
  if (isNaN(parsedAuthorId)) {
    return res.status(404).json({ error: "User not found" });
  }

  const data = {
    imageUrl,
    authorId: parsedAuthorId,
  };

  if (caption !== undefined) data.caption = caption;
  if (location !== undefined) data.location = location;

  try {
    const post = await postsService.createPost(data);
    return res.status(201).json(post);
  } catch (error) {
    if (error.code === "P2003") {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(500).json({ error: error.message });
  }
}

export async function list(req, res) {
  const pagination = parsePagination(req.query);
  if (pagination.error) {
    return res.status(400).json({ error: pagination.error });
  }

  const { search, location, sortBy = "createdAt", order: orderParam } = req.query;

  const allowedSortBy = ["createdAt", "updatedAt", "likes"];
  if (sortBy && !allowedSortBy.includes(sortBy)) {
    return res.status(400).json({ error: "sortBy must be one of: createdAt, updatedAt, likes" });
  }

  const order = orderParam?.toLowerCase() === "asc" ? "asc" : "desc";

  let orderBy;
  if (sortBy === "likes") {
    orderBy = [
      { likes: { _count: order } },
      { createdAt: "desc" },
    ];
  } else {
    orderBy = [
      { [sortBy]: order },
      { createdAt: "desc" },
    ];
  }

  const where = {};
  if (search) {
    where.caption = { contains: search, mode: "insensitive" };
  }
  if (location) {
    where.location = { equals: location, mode: "insensitive" };
  }

  try {
    const { total, posts } = await postsService.listPosts({
      where,
      orderBy,
      skip: pagination.skip,
      take: pagination.limit,
    });

    return res.status(200).json({
      data: posts,
      meta: buildPaginationMeta(pagination.page, pagination.limit, total),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getOne(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(404).json({ error: "Post not found" });
  }

  try {
    const post = await postsService.getPostById(id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    return res.status(200).json(post);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function update(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(404).json({ error: "Post not found" });
  }

  const { caption, location } = req.body || {};
  const data = {};

  if (caption !== undefined) data.caption = caption;
  if (location !== undefined) data.location = location;

  try {
    const updatedPost = await postsService.updatePost(id, data);
    return res.status(200).json(updatedPost);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Post not found" });
    }
    return res.status(500).json({ error: error.message });
  }
}

export async function remove(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(404).json({ error: "Post not found" });
  }

  try {
    await postsService.deletePost(id);
    return res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Post not found" });
    }
    return res.status(500).json({ error: error.message });
  }
}
