import { run } from "hardhat";

async function main() {
  const address = process.env.VITE_CONTRACT_ADDRESS;
  
  if (!address) {
    console.error("❌ VITE_CONTRACT_ADDRESS not set in environment");
    process.exit(1);
  }
  
  console.log(`Verifying contract at ${address}...`);
  
  try {
    await run("verify:verify", {
      address,
      constructorArguments: [],
    });
    console.log("✅ Verification successful!");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ Contract already verified");
    } else {
      console.error("❌ Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

