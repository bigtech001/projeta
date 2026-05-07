import { Router, type IRouter } from "express";
import healthRouter from "./health";
import songsRouter from "./songs";
import collectionsRouter from "./collections";
import liturgyRouter from "./liturgy";
import bibleRouter from "./bible";
import projectionRouter from "./projection";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(songsRouter);
router.use(collectionsRouter);
router.use(liturgyRouter);
router.use(bibleRouter);
router.use(projectionRouter);
router.use(statsRouter);

export default router;
