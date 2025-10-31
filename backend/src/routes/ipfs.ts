import { Router } from "express";
import { ipfsService } from "../services/ipfsService";

const router = Router();

/**
 * POST /api/ipfs/upload
 * Body: { ciphertext: string (base64) }
 * Returns: { cid: string }
 */
router.post("/upload", async (req, res) => {
  try {
    console.log("📥 [IPFS] Upload request received");
    const { ciphertext } = req.body;
    
    if (!ciphertext) {
      console.error("❌ [IPFS] No ciphertext provided");
      return res.status(400).json({
        success: false,
        error: "ciphertext is required",
      });
    }
    
    // Validate size (2MB limit)
    const sizeInBytes = Buffer.from(ciphertext, "base64").length;
    const maxSize = 2 * 1024 * 1024; // 2MB
    
    if (sizeInBytes > maxSize) {
      console.error(`❌ [IPFS] File too large: ${sizeInBytes} bytes`);
      return res.status(400).json({
        success: false,
        error: `Ciphertext too large: ${sizeInBytes} bytes (max: ${maxSize})`,
      });
    }
    
    console.log(`📤 [IPFS] Uploading ${sizeInBytes} bytes...`);
    const cid = await ipfsService.upload(ciphertext);
    
    console.log(`✅ [IPFS] Upload successful: ${cid}`);
    res.json({
      success: true,
      cid,
    });
  } catch (error: any) {
    console.error("❌ [IPFS] Upload error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/ipfs/:cid
 * Returns IPFS content (encrypted, do not decrypt)
 */
router.get("/:cid", async (req, res) => {
  try {
    const { cid } = req.params;
    
    const content = await ipfsService.retrieve(cid);
    
    res.json({
      success: true,
      cid,
      encrypted: true,
      data: content,
    });
  } catch (error: any) {
    console.error("Error retrieving from IPFS:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export { router as ipfsRouter };

