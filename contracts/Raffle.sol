// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

/* Imports */
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";

error Raffle__NotEnoughEntranceFee();
error Raffle__TransferFailed();
error Raffle__NotOpen();
error Raffle__UpkeepNotNeeded(
  uint256 currentBalance,
  uint256 numPlayers,
  uint256 ruffleState
);

contract Raffle is VRFConsumerBaseV2, KeeperCompatibleInterface {
  /* Type Declarations */
  enum RaffleState {
    OPEN,
    CALCULATING
  }

  /* State Variables */
  uint256 private immutable i_entranceFee;
  address payable[] private s_players;
  VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
  bytes32 private immutable i_gasLane;
  uint64 private immutable i_subscriptionId;
  uint16 private constant REQUEST_CONFIRMATIONS = 3;
  uint32 private immutable i_callbackGaslimit;
  uint32 private constant NUM_WORDS = 1;

  address private s_recentWinner;
  RaffleState private s_raffleState;
  uint256 private s_lastTimeStamp;
  uint256 private immutable i_interval;

  /* Events */
  event RaffleEnter(address indexed player);
  event RequestedRaffleWinner(uint256 requestId);
  event WinnerPicked(address indexed winner);

  constructor(
    address vrfCoordinatorV2,
    uint256 entranceFee,
    bytes32 gasLane,
    uint64 subscriptionId,
    uint32 callbackGaslimit,
    uint256 interval
  ) VRFConsumerBaseV2(vrfCoordinatorV2) {
    i_entranceFee = entranceFee;
    i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
    i_gasLane = gasLane;
    i_subscriptionId = subscriptionId;
    i_callbackGaslimit = callbackGaslimit;
    s_raffleState = RaffleState.OPEN;
    s_lastTimeStamp = block.timestamp;
    i_interval = interval;
  }

  function enterRaffle() public payable {
    // Check whether Raffle is open
    if (s_raffleState != RaffleState.OPEN) {
      revert Raffle__NotOpen();
    }

    // check whether the sender is paying min. entrance fee
    if (msg.value < i_entranceFee) {
      revert Raffle__NotEnoughEntranceFee();
    }

    // push the sender to the payable address array
    s_players.push(payable(msg.sender));

    // Emit the player array push event
    emit RaffleEnter(msg.sender);
  }

  /**
   * Doesn't run on-chain.
   * Runs on chainlink chain
   * Checks for whether interval time has elapsed
   * This function gets called by chainlink keeper nodes everytime a block gets minted
   * They look for the 'upkeepNeeded' to return true
   * Aforementioned will happen only if the following conditions are met:
   * 1. Our time interval has passed
   * 2. Lottery should have atleast one player and have some ETH
   * 3. Chainlink subscription should be funded with some ETH
   * 4. Lottery should be in an "open" state
   */
  function checkUpkeep(
    bytes memory /*checkData*/
  )
    public
    override
    returns (
      bool upKeepNeeded,
      bytes memory /* performData */
    )
  {
    bool isOpen = (RaffleState.OPEN == s_raffleState);
    bool isTimePassed = ((block.timestamp - s_lastTimeStamp) > i_interval);
    bool hasPlayers = (s_players.length > 0);
    bool hasEthBalance = (address(this).balance > 0);

    upKeepNeeded = (isOpen && isTimePassed && hasPlayers && hasEthBalance);
  }

  /**
   * Gets triggered when checkUpkeep finds that
   * the interval time has elapsed
   */
  function performUpkeep(
    bytes calldata /* performData */
  ) external override {
    // if someone calls this function directly check for upkeep
    (bool upKeepNeeded, ) = checkUpkeep("");
    if (!upKeepNeeded) {
      revert Raffle__UpkeepNotNeeded(
        address(this).balance,
        s_players.length,
        uint256(s_raffleState)
      );
    }

    s_raffleState = RaffleState.CALCULATING;
    uint256 requestId = i_vrfCoordinator.requestRandomWords(
      i_gasLane, // gasLane
      i_subscriptionId,
      REQUEST_CONFIRMATIONS,
      i_callbackGaslimit,
      NUM_WORDS
    );
    emit RequestedRaffleWinner(requestId);
  }

  function fulfillRandomWords(
    uint256, /*requestId*/
    uint256[] memory randomWords
  ) internal override {
    uint256 indexOfRandomNumber = randomWords[0] % s_players.length;
    address payable raffleWinner = s_players[indexOfRandomNumber];
    s_recentWinner = raffleWinner;
    s_raffleState = RaffleState.OPEN;
    s_players = new address payable[](0);
    (bool success, ) = s_recentWinner.call{value: address(this).balance}("");
    s_lastTimeStamp = block.timestamp;

    if (!success) {
      revert Raffle__TransferFailed();
    }
    emit WinnerPicked(s_recentWinner);
  }

  /* View functions */
  function getEntranceFee() public view returns (uint256) {
    return i_entranceFee;
  }

  function getPlayer(uint256 index) public view returns (address) {
    return s_players[index];
  }

  function getRecentWinner() public view returns (address) {
    return s_recentWinner;
  }

  function getRaffleState() public view returns (RaffleState) {
    return s_raffleState;
  }

  function getNumberOfPlayers() public view returns (uint256) {
    return s_players.length;
  }

  function getLatestTimestamp() public view returns (uint256) {
    return s_lastTimeStamp;
  }

  // since NUM_WORDS is not part of storage, we have to use "pure"
  function getNumWords() public pure returns (uint256) {
    return NUM_WORDS;
  }

  function getRequestConfirmations() public pure returns (uint256) {
    return REQUEST_CONFIRMATIONS;
  }
}
