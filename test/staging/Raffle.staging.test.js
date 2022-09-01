const { expect, assert } = require("chai");
const { network, getNamedAccounts, ethers } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe("Raffle staging test", () => {
      let raffle, raffleEntranceFee, deployer;

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;

        raffle = await ethers.getContract("Raffle", deployer);
        raffleEntranceFee = await raffle.getEntranceFee();
      });

      describe("fulfillRandomWords", () => {
        it("works with live chainlink keeper and vrf, we get a random winner", async () => {
          const startTimeStamp = await raffle.getLatestTimestamp();
          const accounts = await ethers.getSigners();

          await new Promise(async (res, rej) => {
            raffle.once("WinnerPicked", async () => {
              console.log("Winner picked!!");

              try {
                const recentWinner = await raffle.getRecentWinner();
                const raffleState = await raffle.getRaffleState();
                const winnerEndingBalance = await accounts[0].getBalance();
                const endTimeStamp = await raffle.getLatestTimestamp();

                await expect(raffle.getPlayer(0)).to.be.reverted;
                assert.equal(recentWinner.toString(), accounts[0].address);
                assert.equal(raffleState, 0);
                // assert.equal(
                //   winnerEndingBalance.toString(),
                //   winnerStartingBalance.add(raffleEntranceFee).toString()
                // );
                console.log(winnerEndingBalance);
                console.log(winnerStartingBalance);
                assert(endTimeStamp > startTimeStamp);

                res();
              } catch (error) {
                rej();
              }
            });

            await raffle.enterRaffle({ value: raffleEntranceFee });
            const winnerStartingBalance = await accounts[0].getBalance();
          });
        });
      });
    })
  : describe.skip;
