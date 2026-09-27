// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title The 1404 Wall
/// @notice Immutable public inscriptions for the BlockDAG community.
/// @dev Messages are emitted as events. The website may independently
///      filter what it displays; filtering does not alter blockchain history.
contract Wall1404 {
    uint256 public constant MAX_MESSAGES_PER_DAY = 3;
    uint256 public constant MAX_MESSAGE_BYTES = 1120;

    uint256 public inscriptionCount;

    mapping(address => mapping(uint256 => uint256)) private dailyPosts;

    event Inscribed(
        uint256 indexed id,
        address indexed author,
        string message,
        uint256 timestamp
    );

    error EmptyMessage();
    error MessageTooLarge();
    error DailyLimitReached();

    /// @notice Permanently inscribe a message.
    /// @dev No Wall fee is charged. Sender pays only normal network gas.
    function inscribe(string calldata message) external {
        uint256 byteLength = bytes(message).length;

        if (byteLength == 0) revert EmptyMessage();
        if (byteLength > MAX_MESSAGE_BYTES) revert MessageTooLarge();

        uint256 day = block.timestamp / 1 days;
        uint256 usedToday = dailyPosts[msg.sender][day];

        if (usedToday >= MAX_MESSAGES_PER_DAY) {
            revert DailyLimitReached();
        }

        dailyPosts[msg.sender][day] = usedToday + 1;

        unchecked {
            ++inscriptionCount;
        }

        emit Inscribed(
            inscriptionCount,
            msg.sender,
            message,
            block.timestamp
        );
    }

    /// @notice Number of inscriptions already made by a wallet in the
    ///         current UTC day.
    function postsToday(address author) external view returns (uint256) {
        return dailyPosts[author][block.timestamp / 1 days];
    }

    /// @notice Number of inscriptions remaining for a wallet in the
    ///         current UTC day.
    function remainingToday(address author) external view returns (uint256) {
        uint256 used = dailyPosts[author][block.timestamp / 1 days];

        if (used >= MAX_MESSAGES_PER_DAY) {
            return 0;
        }

        return MAX_MESSAGES_PER_DAY - used;
    }
}
