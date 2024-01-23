// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

contract VotingLogic is Initializable {
  string private name;
  
  // Struct to hold poll data
  struct Poll {
    string[] options;    // Array of options for the poll
    mapping(string => uint) votes;  // Mapping of option to vote count
    bool exists;         // Flag to check if the poll exists
  }

  // Mapping from poll ID to Poll struct
  mapping(bytes32 => Poll) public polls;

  // Event emitted when a new poll is created
  event PollCreated(bytes32 pollId);

  // Event emitted when a vote is cast
  event VoteCast(bytes32 pollId, string option);

  function initialize() public initializer {
    name = "VotingLogic-V9";
  }
  
  /**
   * @dev Create a new poll with given options.
     * @param pollId Unique identifier for the poll
     * @param options Array of options for the poll
     */
  function createPoll(bytes32 pollId, string[] memory options) public {
    require(options.length > 1, "There must be at least two options.");
    require(!polls[pollId].exists, "Poll already exists.");

    Poll storage newPoll = polls[pollId];
    for (uint i = 0; i < options.length; i++) {
      newPoll.options.push(options[i]);
      newPoll.votes[options[i]] = 0;
    }
    newPoll.exists = true;

    emit PollCreated(pollId);
  }

  /**
   * @dev Cast a vote in a specific poll.
     * @param pollId Unique identifier for the poll
     * @param option The option to vote for
     */
  function vote(bytes32 pollId, string memory option) public {
    require(polls[pollId].exists, "Poll does not exist.");
    require(polls[pollId].votes[option] >= 0, "Invalid option.");

    polls[pollId].votes[option]++;

    emit VoteCast(pollId, option);
  }

  /**
   * @dev Get the results of a poll.
     * @param pollId Unique identifier for the poll
     * @return An array of options and their respective vote counts
     */
  function getResults(bytes32 pollId) public view returns (string[] memory, uint[] memory) {
    require(polls[pollId].exists, "Poll does not exist.");

    Poll storage poll = polls[pollId];
    uint[] memory voteCounts = new uint[](poll.options.length);

    for (uint i = 0; i < poll.options.length; i++) {
      voteCounts[i] = poll.votes[poll.options[i]];
    }

    return (poll.options, voteCounts);
  }
}
