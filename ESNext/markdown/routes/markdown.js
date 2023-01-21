import { Router } from "express";
const router = Router();
router.get("/", (req, res) => {
    console.log("Message arrived!");
    console.log(req.body);
    res.send(req.query.name);
});
export default router;
//# sourceMappingURL=markdown.js.map