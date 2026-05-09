import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { getDashboardStats } from "../controllers/dashboard.controller";

import type { Router as RouterType } from "express";
const router: RouterType = Router();

router.use(authenticate);
router.get("/stats", getDashboardStats);

export default router;
