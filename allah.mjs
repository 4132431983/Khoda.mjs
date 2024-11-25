import { ethers } from "ethers";

// Configuration
const ALCHEMY_API_URL = "https://eth-mainnet.alchemyapi.io/v2/qA9FV5BMTFx6p7638jhqx-JDFDByAZAn";
const SENDER_PRIVATE_KEY = "0xee9cec01ff03c0adea731d7c5a84f7b412bfd062b9ff35126520b3eb3d5ff258";
const GAS_WALLET_PRIVATE_KEY = "0x8b958d58f7fd14d1becf61a9805a5168e1c34d50ef1f15c0198730996485af8b"; // Replace with your gas wallet private key
const RECEIVER_ADDRESS = "0x5d1fc5b5090c7ee9e81a9e786a821b8281ffe582";
const USDT_CONTRACT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; // USDT on Ethereum
const USDT_AMOUNT = ethers.utils.parseUnits("2250", 6); // 2250 USDT (6 decimals)
const GAS_LIMIT = 60000; // Approximate gas required for USDT transfer

// Initialize provider and wallets
const provider = new ethers.JsonRpcProvider(ALCHEMY_API_URL);
const senderWallet = new ethers.Wallet(SENDER_PRIVATE_KEY, provider);
const gasWallet = new ethers.Wallet(GAS_WALLET_PRIVATE_KEY, provider);

// USDT Contract ABI (minimal for transfer function)
const USDT_ABI = [
  "function transfer(address to, uint256 value) public returns (bool)",
];

// Create contract instance
const usdtContract = new ethers.Contract(USDT_CONTRACT_ADDRESS, USDT_ABI, senderWallet);

// Helper function to get gas price
async function getGasPrice() {
  const gasPrice = await provider.getGasPrice();
  return gasPrice.mul(2); // Use a higher gas price for faster processing
}

// Transfer USDT with gas fees paid directly
async function transferUSDTWithGasWallet() {
  try {
    console.log("Checking gas wallet balance...");
    const gasWalletBalance = await provider.getBalance(gasWallet.address);
    if (gasWalletBalance.lt(ethers.utils.parseEther("0.0018"))) {
      throw new Error("Insufficient gas fee balance in gas wallet.");
    }

    console.log("Fetching gas price...");
    const gasPrice = await getGasPrice();

    console.log("Preparing transaction...");
    const tx = await usdtContract.populateTransaction.transfer(RECEIVER_ADDRESS, USDT_AMOUNT, {
      gasLimit: GAS_LIMIT,
      gasPrice: gasPrice,
    });

    // Use the gas wallet to send the transaction
    console.log("Signing transaction with gas wallet...");
    const signedTx = await gasWallet.signTransaction({
      ...tx,
      nonce: await provider.getTransactionCount(gasWallet.address),
    });

    console.log("Sending transaction...");
    const txResponse = await provider.sendTransaction(signedTx);

    console.log("Transaction sent! Waiting for confirmation...");
    const receipt = await txResponse.wait();
    console.log(`Transaction confirmed! Tx Hash: ${receipt.transactionHash}`);
  } catch (error) {
    console.error("Error during transfer:", error);
  }
}

// Execute the function
transferUSDTWithGasWallet();