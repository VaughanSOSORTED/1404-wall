import { expect } from "chai";
import { network } from "hardhat";

const connection = await network.connect();
const { ethers } = connection;

describe("Wall1404", function () {
  async function deployWall() {
    const Wall = await ethers.getContractFactory("Wall1404");
    const wall = await Wall.deploy();
    await wall.waitForDeployment();

    const [owner, other] = await ethers.getSigners();
    return { wall, owner, other };
  }

  async function expectCustomError(promise, contract, errorName) {
    try {
      await promise;
      expect.fail(`Expected ${errorName}`);
    } catch (error) {
      const data =
        error?.data ??
        error?.error?.data ??
        error?.info?.error?.data;

      const parsed = contract.interface.parseError(data);
      expect(parsed?.name).to.equal(errorName);
    }
  }

  it("starts with zero inscriptions", async function () {
    const { wall } = await deployWall();
    expect(await wall.inscriptionCount()).to.equal(0n);
  });

  it("records an inscription and emits the correct event", async function () {
    const { wall, owner } = await deployWall();

    const tx = await wall.inscribe(
      "The community builds. The community delivers."
    );
    const receipt = await tx.wait();

    const event = receipt.logs
      .map(log => {
        try {
          return wall.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find(log => log?.name === "Inscribed");

    expect(event).to.not.equal(undefined);
    expect(event.args.id).to.equal(1n);
    expect(event.args.author).to.equal(owner.address);
    expect(event.args.message)
      .to.equal("The community builds. The community delivers.");
    expect(event.args.timestamp).to.be.greaterThan(0n);

    expect(await wall.inscriptionCount()).to.equal(1n);
    expect(await wall.postsToday(owner.address)).to.equal(1n);
    expect(await wall.remainingToday(owner.address)).to.equal(2n);
  });

  it("rejects an empty message", async function () {
    const { wall } = await deployWall();

    await expectCustomError(
      wall.inscribe(""),
      wall,
      "EmptyMessage"
    );
  });

  it("accepts a message at the byte ceiling", async function () {
    const { wall } = await deployWall();

    const tx = await wall.inscribe("a".repeat(1120));
    await tx.wait();

    expect(await wall.inscriptionCount()).to.equal(1n);
  });


  it("accepts 280 four-byte Unicode characters at exactly 1120 bytes", async function () {
    const { wall } = await deployWall();

    const message = "😀".repeat(280);

    expect([...message].length).to.equal(280);
    expect(new TextEncoder().encode(message).length).to.equal(1120);

    await wall.inscribe(message);

    expect(await wall.inscriptionCount()).to.equal(1n);
  });

  it("rejects 281 four-byte Unicode characters above the 1120-byte ceiling", async function () {
    const { wall } = await deployWall();

    const message = "😀".repeat(281);

    expect([...message].length).to.equal(281);
    expect(new TextEncoder().encode(message).length).to.equal(1124);

    await expectCustomError(
      wall.inscribe(message),
      wall,
      "MessageTooLarge"
    );
  });

  it("rejects a message above the byte ceiling", async function () {
    const { wall } = await deployWall();

    await expectCustomError(
      wall.inscribe("a".repeat(1121)),
      wall,
      "MessageTooLarge"
    );
  });

  it("allows exactly three messages per wallet per UTC day", async function () {
    const { wall, owner } = await deployWall();

    await (await wall.inscribe("Message one")).wait();
    await (await wall.inscribe("Message two")).wait();
    await (await wall.inscribe("Message three")).wait();

    expect(await wall.postsToday(owner.address)).to.equal(3n);
    expect(await wall.remainingToday(owner.address)).to.equal(0n);

    await expectCustomError(
      wall.inscribe("Message four"),
      wall,
      "DailyLimitReached"
    );
  });

  it("tracks daily limits independently for each wallet", async function () {
    const { wall, owner, other } = await deployWall();

    await (await wall.connect(owner).inscribe("Owner one")).wait();
    await (await wall.connect(owner).inscribe("Owner two")).wait();
    await (await wall.connect(owner).inscribe("Owner three")).wait();

    expect(await wall.remainingToday(owner.address)).to.equal(0n);
    expect(await wall.remainingToday(other.address)).to.equal(3n);

    await (await wall.connect(other).inscribe("Different wallet")).wait();

    expect(await wall.remainingToday(other.address)).to.equal(2n);
  });

  it("resets the allowance when the next UTC day begins", async function () {
    const { wall, owner } = await deployWall();

    await (await wall.inscribe("One")).wait();
    await (await wall.inscribe("Two")).wait();
    await (await wall.inscribe("Three")).wait();

    expect(await wall.remainingToday(owner.address)).to.equal(0n);

    const latest = await ethers.provider.getBlock("latest");
    const nextDay =
      (Math.floor(Number(latest.timestamp) / 86400) + 1) * 86400;

    await connection.provider.send("evm_setNextBlockTimestamp", [nextDay]);
    await connection.provider.send("evm_mine");

    expect(await wall.postsToday(owner.address)).to.equal(0n);
    expect(await wall.remainingToday(owner.address)).to.equal(3n);

    await (await wall.inscribe("New UTC day")).wait();

    expect(await wall.remainingToday(owner.address)).to.equal(2n);
  });

  it("has no owner/admin edit or delete functions", async function () {
    const { wall } = await deployWall();

    const names = wall.interface.fragments
      .filter(fragment => fragment.type === "function")
      .map(fragment => fragment.name);

    expect(names).to.not.include("owner");
    expect(names).to.not.include("deleteMessage");
    expect(names).to.not.include("editMessage");
    expect(names).to.not.include("setDailyLimit");
  });
});
