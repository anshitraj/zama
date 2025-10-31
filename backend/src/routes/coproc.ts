import { Router } from "express";
import { coprocService } from "../services/coprocService";

const router = Router();

/**
 * POST /api/coproc/aggregate
 * Body: { cids: string[], op: "sum" | "max" | "min" }
 * Returns: { outputCiphertext: string, meta: {...} }
 */
router.post("/aggregate", async (req, res) => {
  try {
    const { cids, op = "sum" } = req.body;
    
    if (!cids || !Array.isArray(cids) || cids.length === 0) {
      return res.status(400).json({
        success: false,
        error: "cids array is required and must not be empty",
      });
    }
    
    if (!["sum", "max", "min", "avg"].includes(op)) {
      return res.status(400).json({
        success: false,
        error: "Invalid operation. Must be: sum, max, min, avg",
      });
    }
    
    const result = await coprocService.aggregate(cids, op);
    
    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("Error in coprocessor aggregation:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/coproc/health
 * Check coprocessor availability
 */
router.get("/health", async (req, res) => {
  try {
    const health = await coprocService.healthCheck();
    res.json(health);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export { router as coprocRouter };

