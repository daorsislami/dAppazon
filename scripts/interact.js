// This is just a simple file that I've added to interact with the deployed smart contract locally
// Currently this just receives the smart contract balance.


// importing ether.js, first you need to have it installed in your project, you can import it via package.json and add it inside dependencies object then do npm install
const { ethers } = require("ethers");

const hre = require("hardhat");


// Abstract binary interface or abi - it describes what function does smart contract have
const ERC20_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function totalSupply() view returns(uint256)",
    "function balanceOf(address) view returns (uint)"
];


const main = async () => {

    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

    // Get the ContractFactory for our Dappazon contract
    const Dappazon = await hre.ethers.getContractFactory("Dappazon");

    // Connect to the deployed contract
    const dappazon = await Dappazon.attach(contractAddress);

    // Get the deployer's account
    const [deployer] = await hre.ethers.getSigners();

    // Example: Get the balance of the deployer
    console.log("Getting the balance of the deployer...");
    const balance = await dappazon.getContractBalance();
    console.log("Deployer's balance:", hre.ethers.utils.formatEther(balance), "ETH");
};

main();