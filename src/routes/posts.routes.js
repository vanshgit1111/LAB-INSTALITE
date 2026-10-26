import { Router } from "express";
import * as postsController from "../controllers/posts.controller.js";

const router = Router();

router.post("/", postsController.create);
router.get("/", postsController.list);
router.get("/:id", postsController.getOne);
router.patch("/:id", postsController.update);
router.delete("/:id", postsController.remove);

export default router;
