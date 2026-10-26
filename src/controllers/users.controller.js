import * as usersService from "../services/users.service.js";
import * as postsService from "../services/posts.service.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";

export async function create(req, res) {
  const { username, email, fullname, bio } = req.body || {};

  if (!username || !email || !fullname) {
    return res.status(400).json({ error: "username, email and fullname are required" });
  }

  const data = {
    username,
    email,
    fullname,
  };

  if (bio !== undefined) {
    data.bio = bio;
  }

  try {
    const user = await usersService.createUser(data);
    return res.status(201).json(user);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "username or email already taken" });
    }
    return res.status(500).json({ error: error.message });
  }
}

export async function list(req, res) {
  const pagination = parsePagination(req.query);
  if (pagination.error) {
    return res.status(400).json({ error: pagination.error });
  }

  const { search, isPrivate, hasPosts, sortBy = "createdAt", order: orderParam } = req.query;

  const where = {};

  if (search) {
    where.OR = [
      { username: { contains: search, mode: "insensitive" } },
      { fullname: { contains: search, mode: "insensitive" } },
    ];
  }

  if (isPrivate !== undefined) {
    if (isPrivate === "true") {
      where.isPrivate = true;
    } else if (isPrivate === "false") {
      where.isPrivate = false;
    } else {
      return res.status(400).json({ error: "isPrivate must be true or false" });
    }
  }

  if (hasPosts !== undefined) {
    if (hasPosts === "true") {
      where.posts = { some: {} };
    } else if (hasPosts === "false") {
      where.posts = { none: {} };
    } else {
      return res.status(400).json({ error: "hasPosts must be true or false" });
    }
  }

  const order = orderParam?.toLowerCase() === "asc" ? "asc" : "desc";
  const orderBy = [{ [sortBy]: order }];

  try {
    const { total, users } = await usersService.listUsers({
      where,
      orderBy,
      skip: pagination.skip,
      take: pagination.limit,
    });

    return res.status(200).json({
      data: users,
      meta: buildPaginationMeta(pagination.page, pagination.limit, total),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getOne(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(404).json({ error: "User not found" });
  }

  try {
    const user = await usersService.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function update(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(404).json({ error: "User not found" });
  }

  const { fullname, bio, isPrivate } = req.body || {};
  const data = {};

  if (fullname !== undefined) data.fullname = fullname;
  if (bio !== undefined) data.bio = bio;
  if (isPrivate !== undefined) data.isPrivate = isPrivate;

  try {
    const updatedUser = await usersService.updateUser(id, data);
    return res.status(200).json(updatedUser);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(500).json({ error: error.message });
  }
}

export async function remove(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(404).json({ error: "User not found" });
  }

  try {
    await usersService.deleteUser(id);
    return res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(500).json({ error: error.message });
  }
}

export async function getUserPosts(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(404).json({ error: "User not found" });
  }

  const pagination = parsePagination(req.query);
  if (pagination.error) {
    return res.status(400).json({ error: pagination.error });
  }

  try {
    const user = await usersService.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { total, posts } = await postsService.getUserPosts(id, {
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

export async function getUserLikedPosts(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(404).json({ error: "User not found" });
  }

  const pagination = parsePagination(req.query);
  if (pagination.error) {
    return res.status(400).json({ error: pagination.error });
  }

  try {
    const user = await usersService.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { total, posts } = await postsService.getUserLikedPosts(id, {
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
