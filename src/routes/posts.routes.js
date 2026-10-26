import { Router } from "express";
import * as postsController from "../controllers/posts.controller.js";
import * as likesController from "../controllers/likes.controller.js";

const router = Router();

router.post("/", postsController.create);
router.get("/", postsController.list);
router.get("/:id", postsController.getOne);
router.patch("/:id", postsController.update);
router.delete("/:id", postsController.remove);

router.get("/:id/likes", likesController.listPostLikes);
router.post("/:id/likes", likesController.likePost);
router.delete("/:id/likes/:userId", likesController.unlikePost);

export default router;
