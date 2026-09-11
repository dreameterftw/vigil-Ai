import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const networkName = network.name;

  console.log("─────────────────────────────────────────");
  console.log("  VIGIL DealLock — Deployment");
  console.log("─────────────────────────────────────────");
  console.log(`  Network:  ${networkName}`);
  console.log(`  Deployer: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`  Balance:  ${ethers.formatEther(balance)} ETH`);
  console.log("─────────────────────────────────────────");

  if (networkName === "polygonAmoy" && balance === 0n) {
    console.error("❌ Deployer wallet has 0 POL on Polygon Amoy. Get free testnet POL from:");
    console.error("   https://www.coinbase.com/faucets/base-ethereum-goerli-faucet");
    console.error("   or: https://faucet.quicknode.com/base/sepolia");
    process.exit(1);
  }

  console.log("\n📦 Deploying DealLock contract...");
  const DealLock = await ethers.getContractFactory("DealLock");
  const dealLock = await DealLock.deploy();
  await dealLock.waitForDeployment();

  const address = await dealLock.getAddress();
  const deployTx = dealLock.deploymentTransaction();

  console.log("\n✅ DealLock deployed!");
  console.log(`   Address: ${address}`);
  console.log(`   Tx hash: ${deployTx?.hash || "N/A"}`);

  if (networkName === "polygonAmoy") {
    console.log(`   Explorer: https://amoy.polygonscan.com/address/${address}`);
  }

  // ── Save deployment info ────────────────────────────────────
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deployment = {
    network: networkName,
    chainId: network.config.chainId,
    contractAddress: address,
    deployerAddress: deployer.address,
    transactionHash: deployTx?.hash || null,
    deployedAt: new Date().toISOString(),
    blockNumber: deployTx?.blockNumber || null,
  };

  const filePath = path.join(deploymentsDir, `${networkName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(deployment, null, 2));
  console.log(`\n💾 Deployment saved to: ${filePath}`);

  // ── Print .env update instructions ─────────────────────────
  console.log("\n─────────────────────────────────────────");
  console.log("  Add to .env.local:");
  console.log(`  NEXT_PUBLIC_DEALLOCK_CONTRACT_ADDRESS=${address}`);
  console.log("─────────────────────────────────────────\n");
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
