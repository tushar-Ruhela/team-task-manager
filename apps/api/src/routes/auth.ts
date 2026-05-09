import { Router } from "express";
import { signup, login, refresh, logout, getMe } from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/authenticate";
import { signupSchema, loginSchema } from "../schemas/auth.schema";

import type { Router as RouterType } from "express";
const router: RouterType = Router();

router.post("/signup", validate(signupSchema), signup);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", authenticate, getMe);

export default router;
