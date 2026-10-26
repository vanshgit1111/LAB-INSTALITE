import * as likesService from "../services/likes.service.js";
import * as postsService from "../services/posts.service.js";
import * as usersService from "../services/users.service.js";

export async function listPostLikes(req, res) {
  const postId = parseInt(req.params.id, 10);
  if (isNaN(postId)) {
    return res.status(404).json({ error: "Post not found" });
  }

  try {
    const post = await postsService.getPostById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const likers = await likesService.getLikesByPostId(postId);
    return res.status(200).json(likers);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function likePost(req, res) {
  const postId = parseInt(req.params.id, 10);
  if (isNaN(postId)) {
    return res.status(404).json({ error: "Post not found" });
  }

  const { userId } = req.body || {};
  if (userId === undefined || userId === null) {
    return res.status(400).json({ error: "userId is required" });
  }

  const parsedUserId = parseInt(userId, 10);
  if (isNaN(parsedUserId)) {
    return res.status(404).json({ error: "User not found" });
  }

  try {
    const post = await postsService.getPostById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const user = await usersService.getUserById(parsedUserId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const like = await likesService.createLike(parsedUserId, postId);
    return res.status(201).json(like);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Already liked" });
    }
    return res.status(500).json({ error: error.message });
  }
}

export async function unlikePost(req, res) {
  const postId = parseInt(req.params.id, 10);
  const userId = parseInt(req.params.userId, 10);

  if (isNaN(postId) || isNaN(userId)) {
    return res.status(404).json({ error: "Like not found" });
  }

  try {
    await likesService.deleteLike(userId, postId);
    return res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Like not found" });
    }
    return res.status(500).json({ error: error.message });
  }
}
