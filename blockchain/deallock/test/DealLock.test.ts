import { expect } from "chai";
import { ethers } from "hardhat";
import { DealLock } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("DealLock", function () {
  let dealLock: DealLock;
  let buyer: HardhatEthersSigner;
  let seller: HardhatEthersSigner;
  let thirdParty: HardhatEthersSigner;

  const termsHash = ethers.keccak256(ethers.toUtf8Bytes("test-deal-terms-v1"));
  const futureDeadline = () => Math.floor(Date.now() / 1000) + 86400 * 30; // 30 days

  beforeEach(async () => {
    [buyer, seller, thirdParty] = await ethers.getSigners();
    const DealLockFactory = await ethers.getContractFactory("DealLock");
    dealLock = await DealLockFactory.deploy() as DealLock;
    await dealLock.waitForDeployment();
  });

  // ── createDeal ─────────────────────────────────────────────
  describe("createDeal", () => {
    it("should create a deal and emit DealCreated event", async () => {
      const amount = ethers.parseEther("0.01");
      const stake = ethers.parseEther("0.001");
      const deadline = futureDeadline();

      await expect(
        dealLock.connect(buyer).createDeal(
          seller.address, amount, termsHash, deadline, 10,
          { value: stake }
        )
      )
        .to.emit(dealLock, "DealCreated")
        .withArgs(1n, buyer.address, seller.address, termsHash, amount, deadline, 10n, stake);
    });

    it("should reject zero seller address", async () => {
      await expect(
        dealLock.connect(buyer).createDeal(
          ethers.ZeroAddress, 0n, termsHash, futureDeadline(), 10
        )
      ).to.be.revertedWith("DealLock: Invalid seller address");
    });

    it("should reject buyer == seller", async () => {
      await expect(
        dealLock.connect(buyer).createDeal(
          buyer.address, 0n, termsHash, futureDeadline(), 10
        )
      ).to.be.revertedWith("DealLock: Buyer and seller cannot be the same");
    });

    it("should reject past deadline", async () => {
      const pastDeadline = Math.floor(Date.now() / 1000) - 3600;
      await expect(
        dealLock.connect(buyer).createDeal(
          seller.address, 0n, termsHash, pastDeadline, 10
        )
      ).to.be.revertedWith("DealLock: Deadline must be in the future");
    });

    it("should reject penalty > 50%", async () => {
      await expect(
        dealLock.connect(buyer).createDeal(
          seller.address, 0n, termsHash, futureDeadline(), 51
        )
      ).to.be.revertedWith("DealLock: Penalty 1-50%");
    });

    it("should increment dealCounter", async () => {
      await dealLock.connect(buyer).createDeal(
        seller.address, 0n, termsHash, futureDeadline(), 10
      );
      await dealLock.connect(buyer).createDeal(
        seller.address, 0n, termsHash, futureDeadline(), 10
      );
      expect(await dealLock.totalDeals()).to.equal(2n);
    });
  });

  // ── confirmDeal ────────────────────────────────────────────
  describe("confirmDeal", () => {
    let dealId: bigint;

    beforeEach(async () => {
      await dealLock.connect(buyer).createDeal(
        seller.address, 0n, termsHash, futureDeadline(), 10
      );
      dealId = await dealLock.totalDeals();
    });

    it("seller can confirm a pending deal", async () => {
      await expect(dealLock.connect(seller).confirmDeal(dealId))
        .to.emit(dealLock, "DealConfirmed")
        .withArgs(dealId, seller.address, await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));
    });

    it("buyer cannot confirm their own deal", async () => {
      await expect(dealLock.connect(buyer).confirmDeal(dealId))
        .to.be.revertedWith("DealLock: Only seller");
    });

    it("third party cannot confirm", async () => {
      await expect(dealLock.connect(thirdParty).confirmDeal(dealId))
        .to.be.revertedWith("DealLock: Only seller");
    });
  });

  // ── getDeal ────────────────────────────────────────────────
  describe("getDeal", () => {
    it("returns correct deal data", async () => {
      const amount = ethers.parseEther("0.05");
      const deadline = futureDeadline();
      await dealLock.connect(buyer).createDeal(
        seller.address, amount, termsHash, deadline, 15
      );
      const deal = await dealLock.getDeal(1n);
      expect(deal.buyer).to.equal(buyer.address);
      expect(deal.seller).to.equal(seller.address);
      expect(deal.termsHash).to.equal(termsHash);
      expect(deal.penaltyPercent).to.equal(15n);
      expect(deal.state).to.equal(0n); // Pending
    });
  });
});
