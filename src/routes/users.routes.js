import { Router } from "express";
import * as usersController from "../controllers/users.controller.js";

const router = Router();

router.post("/", usersController.create);
router.get("/", usersController.list);
router.get("/:id", usersController.getOne);
router.patch("/:id", usersController.update);
router.delete("/:id", usersController.remove);

export default router;
