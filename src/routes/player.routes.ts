import { Router } from "express";
import { playerJoinRoom } from "../controller/player.controller";
const router = Router();

router.post('/', playerJoinRoom)

export default router;