import hre from "hardhat";

const { ethers } = await hre.network.connect();

console.log("");
console.log("LOCAL DEPLOYMENT SIMULATION");
console.log("========================================");

const [deployer, secondWallet] =
  await ethers.getSigners();

console.log(
  "Simulated deployer:",
  deployer.address
);

const Factory =
  await ethers.getContractFactory("Wall1404");

const deploymentTx =
  await Factory.getDeployTransaction();

const deploymentGas =
  await deployer.estimateGas(deploymentTx);

console.log(
  "Estimated deployment gas:",
  deploymentGas.toString()
);

const wall =
  await Factory.deploy();

await wall.waitForDeployment();

const address =
  await wall.getAddress();

console.log(
  "Local contract address:",
  address
);

console.log(
  "MAX_MESSAGES_PER_DAY:",
  (await wall.MAX_MESSAGES_PER_DAY()).toString()
);

console.log(
  "MAX_MESSAGE_BYTES:",
  (await wall.MAX_MESSAGE_BYTES()).toString()
);

console.log(
  "Initial inscription count:",
  (await wall.inscriptionCount()).toString()
);

console.log(
  "Initial remaining allowance:",
  (await wall.remainingToday(deployer.address)).toString()
);


const sample =
  "The Community Builds. The Community Delivers.";

const gas =
  await wall.inscribe.estimateGas(sample);

console.log(
  "Estimated sample inscription gas:",
  gas.toString()
);


const tx =
  await wall.inscribe(sample);

const receipt =
  await tx.wait();

console.log(
  "Actual local inscription gas:",
  receipt.gasUsed.toString()
);

console.log(
  "Inscription count after test:",
  (await wall.inscriptionCount()).toString()
);

console.log(
  "Remaining after one inscription:",
  (await wall.remainingToday(deployer.address)).toString()
);


const secondRemaining =
  await wall.remainingToday(secondWallet.address);

console.log(
  "Second wallet allowance:",
  secondRemaining.toString()
);


console.log("");
console.log("LOCAL DEPLOYMENT SIMULATION: PASS");
