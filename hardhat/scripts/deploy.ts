import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying ConfidentialExpenses contract...");
  console.log("Deployer address:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "ETH");
  
  const ConfidentialExpenses = await ethers.getContractFactory("ConfidentialExpenses");
  const contract = await ConfidentialExpenses.deploy();
  
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  
  console.log("\n✅ Deployment successful!");
  console.log("Contract address:", address);
  console.log("\nUpdate your .env file:");
  console.log(`VITE_CONTRACT_ADDRESS=${address}\n`);
  
  // Save to deployments folder for migration scripts
  const fs = require("fs");
  const deploymentsDir = "./deployments";
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  fs.writeFileSync(
    `${deploymentsDir}/address.json`,
    JSON.stringify({
      address,
      network: network.name,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
    }, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

