import { expect } from "chai";
import { ethers } from "hardhat";

describe("ConfidentialExpenses", function () {
  let contract: any;
  let owner: any;
  let user1: any;
  let user2: any;
  
  const TEST_CID = "QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o";
  
  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const ConfidentialExpenses = await ethers.getContractFactory("ConfidentialExpenses");
    contract = await ConfidentialExpenses.deploy();
    await contract.waitForDeployment();
  });
  
  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(contract).to.be.ok;
      const address = await contract.getAddress();
      expect(address).to.have.length(42);
    });
  });
  
  describe("Expense Attestation", function () {
    it("Should allow user to attest an expense", async function () {
      const submissionHash = ethers.keccak256(ethers.toUtf8Bytes(TEST_CID));
      
      await expect(contract.connect(user1).attestExpense(submissionHash, TEST_CID, "0x"))
        .to.emit(contract, "ExpenseAttested")
        .withArgs(user1.address, submissionHash, TEST_CID);
    });
    
    it("Should prevent duplicate attestations", async function () {
      const submissionHash = ethers.keccak256(ethers.toUtf8Bytes(TEST_CID));
      
      await contract.connect(user1).attestExpense(submissionHash, TEST_CID, "0x");
      
      await expect(
        contract.connect(user1).attestExpense(submissionHash, TEST_CID, "0x")
      ).to.be.revertedWith("Already attested");
    });
    
    it("Should store and retrieve user CIDs", async function () {
      const cid1 = "QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o1";
      const cid2 = "QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o2";
      
      const hash1 = ethers.keccak256(ethers.toUtf8Bytes(cid1));
      const hash2 = ethers.keccak256(ethers.toUtf8Bytes(cid2));
      
      await contract.connect(user1).attestExpense(hash1, cid1, "0x");
      await contract.connect(user1).attestExpense(hash2, cid2, "0x");
      
      const cids = await contract.getUserCids(user1.address);
      expect(cids).to.have.length(2);
      expect(cids[0]).to.equal(cid1);
      expect(cids[1]).to.equal(cid2);
    });
    
    it("Should track attestation count", async function () {
      const submissionHash = ethers.keccak256(ethers.toUtf8Bytes(TEST_CID));
      
      expect(await contract.getUserAttestationCount(user1.address)).to.equal(0);
      
      await contract.connect(user1).attestExpense(submissionHash, TEST_CID, "0x");
      
      expect(await contract.getUserAttestationCount(user1.address)).to.equal(1);
    });
  });
  
  describe("Public Key Registration", function () {
    it("Should emit PublicKeyRegistered event", async function () {
      const testPubKey = ethers.toUtf8Bytes("test-public-key");
      
      await expect(contract.connect(user1).registerPublicKey(testPubKey))
        .to.emit(contract, "PublicKeyRegistered")
        .withArgs(user1.address, testPubKey);
    });
  });
  
  describe("Multiple Users", function () {
    it("Should isolate CIDs between users", async function () {
      const cid1 = "QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o1";
      const cid2 = "QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o2";
      
      await contract.connect(user1).attestExpense(
        ethers.keccak256(ethers.toUtf8Bytes(cid1)), cid1, "0x"
      );
      await contract.connect(user2).attestExpense(
        ethers.keccak256(ethers.toUtf8Bytes(cid2)), cid2, "0x"
      );
      
      expect(await contract.getUserCids(user1.address)).to.have.length(1);
      expect(await contract.getUserCids(user2.address)).to.have.length(1);
    });
  });
});

