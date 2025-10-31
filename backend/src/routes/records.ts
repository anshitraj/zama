import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/records
 * Query parameters: limit, category, userAddress
 */
router.get("/", async (req, res) => {
  try {
    const { limit = "50", category, userAddress } = req.query;
    
    const where: any = {};
    if (category) where.category = category as string;
    if (userAddress) where.userAddress = (userAddress as string).toLowerCase();
    
    const records = await prisma.expense.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: parseInt(limit as string),
    });
    
    res.json({
      success: true,
      count: records.length,
      records,
    });
  } catch (error: any) {
    console.error("Error fetching records:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/records/:cid
 */
router.get("/:cid", async (req, res) => {
  try {
    const { cid } = req.params;
    
    const record = await prisma.expense.findUnique({
      where: { cid },
    });
    
    if (!record) {
      return res.status(404).json({
        success: false,
        error: "Record not found",
      });
    }
    
    res.json({
      success: true,
      record,
    });
  } catch (error: any) {
    console.error("Error fetching record:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/proof/:cid
 * Returns proof details including event metadata
 */
router.get("/proof/:cid", async (req, res) => {
  try {
    const { cid } = req.params;
    
    const record = await prisma.expense.findUnique({
      where: { cid },
    });
    
    if (!record) {
      return res.status(404).json({
        success: false,
        error: "Proof not found",
      });
    }
    
    // Return metadata only - NOT decrypted amounts
    res.json({
      success: true,
      proof: {
        cid: record.cid,
        submissionHash: record.submissionHash,
        txHash: record.txHash,
        blockNumber: record.blockNumber,
        timestamp: record.timestamp,
        userAddress: record.userAddress,
        category: record.category,
      },
      // Do not return decrypted data
      encrypted: true,
    });
  } catch (error: any) {
    console.error("Error fetching proof:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export { router as recordsRouter };

