// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title DealLock
 * @notice VIGIL blockchain-enforced B2B deal protection.
 *
 * Purpose:
 *   - Create tamper-evident proof of agreed B2B terms on Polygon Amoy
 *   - Demonstrate programmable penalty enforcement in the prototype
 *
 * Scope:
 *   - TESTNET ONLY — Polygon Amoy
 *   - Not a production financial escrow system
 *   - Prototype demonstrates the concept; not for real-money use
 *
 * Flow:
 *   1. Buyer calls createDeal() with terms hash + optional stake (MATIC)
 *   2. Seller calls confirmDeal() to acknowledge terms
 *   3. On breach, either party calls reportBreach()
 *   4. Penalty logic is executed automatically on-chain
 *   5. On completion, buyer calls completeDeal()
 */
contract DealLock {

    // ── State machine ─────────────────────────────────────────
    enum DealState {
        Pending,    // Created, awaiting seller confirmation
        Active,     // Both parties confirmed
        Breached,   // Breach reported — penalty triggered
        Completed,  // Successfully completed
        Cancelled   // Cancelled by mutual agreement
    }

    // ── Deal struct ───────────────────────────────────────────
    struct Deal {
        address buyer;
        address seller;
        uint256 amount;          // Agreed deal value (informational)
        bytes32 termsHash;       // SHA-256 of canonical terms JSON
        uint256 paymentDeadline; // Unix timestamp
        uint256 penaltyPercent;  // 1–50
        uint256 stake;           // MATIC staked by buyer (optional)
        DealState state;
        uint256 createdAt;
        uint256 confirmedAt;
        uint256 breachedAt;
    }

    // ── Storage ───────────────────────────────────────────────
    uint256 private _dealCounter;
    mapping(uint256 => Deal) public deals;

    // ── Events ────────────────────────────────────────────────
    event DealCreated(
        uint256 indexed dealId,
        address indexed buyer,
        address indexed seller,
        bytes32 termsHash,
        uint256 amount,
        uint256 paymentDeadline,
        uint256 penaltyPercent,
        uint256 stake
    );

    event DealConfirmed(
        uint256 indexed dealId,
        address indexed seller,
        uint256 confirmedAt
    );

    event DealBreached(
        uint256 indexed dealId,
        address indexed reportedBy,
        uint256 penaltyAmount,
        uint256 breachedAt
    );

    event DealCompleted(
        uint256 indexed dealId,
        uint256 completedAt
    );

    event DealCancelled(
        uint256 indexed dealId,
        uint256 cancelledAt
    );

    // ── Modifiers ─────────────────────────────────────────────
    modifier onlyBuyer(uint256 dealId) {
        require(msg.sender == deals[dealId].buyer, "DealLock: Only buyer");
        _;
    }

    modifier onlySeller(uint256 dealId) {
        require(msg.sender == deals[dealId].seller, "DealLock: Only seller");
        _;
    }

    modifier onlyParty(uint256 dealId) {
        require(
            msg.sender == deals[dealId].buyer ||
            msg.sender == deals[dealId].seller,
            "DealLock: Only deal parties"
        );
        _;
    }

    modifier inState(uint256 dealId, DealState expected) {
        require(deals[dealId].state == expected, "DealLock: Invalid state for this action");
        _;
    }

    // ── createDeal ────────────────────────────────────────────
    /**
     * @notice Buyer creates a protected deal.
     * @param _seller       Seller wallet address
     * @param _amount       Agreed deal value in wei (informational)
     * @param _termsHash    SHA-256 hash of the canonical terms JSON
     * @param _paymentDeadline Unix timestamp for payment deadline
     * @param _penaltyPercent  Penalty percentage (1-50)
     * @return dealId The new deal ID
     *
     * Caller may optionally send MATIC as stake (msg.value).
     * If stake > 0, it is held in the contract until completion or breach.
     */
    function createDeal(
        address _seller,
        uint256 _amount,
        bytes32 _termsHash,
        uint256 _paymentDeadline,
        uint256 _penaltyPercent
    ) external payable returns (uint256 dealId) {
        require(_seller != address(0), "DealLock: Invalid seller address");
        require(_seller != msg.sender, "DealLock: Buyer and seller cannot be the same");
        require(_termsHash != bytes32(0), "DealLock: Terms hash required");
        require(_paymentDeadline > block.timestamp, "DealLock: Deadline must be in the future");
        require(_penaltyPercent >= 1 && _penaltyPercent <= 50, "DealLock: Penalty 1-50%");

        dealId = ++_dealCounter;

        deals[dealId] = Deal({
            buyer: msg.sender,
            seller: _seller,
            amount: _amount,
            termsHash: _termsHash,
            paymentDeadline: _paymentDeadline,
            penaltyPercent: _penaltyPercent,
            stake: msg.value,
            state: DealState.Pending,
            createdAt: block.timestamp,
            confirmedAt: 0,
            breachedAt: 0
        });

        emit DealCreated(
            dealId,
            msg.sender,
            _seller,
            _termsHash,
            _amount,
            _paymentDeadline,
            _penaltyPercent,
            msg.value
        );
    }

    // ── confirmDeal ───────────────────────────────────────────
    /**
     * @notice Seller confirms they acknowledge the terms.
     */
    function confirmDeal(uint256 dealId)
        external
        onlySeller(dealId)
        inState(dealId, DealState.Pending)
    {
        deals[dealId].state = DealState.Active;
        deals[dealId].confirmedAt = block.timestamp;

        emit DealConfirmed(dealId, msg.sender, block.timestamp);
    }

    // ── reportBreach ──────────────────────────────────────────
    /**
     * @notice Either party reports a breach.
     * If stake was provided and breach is after the deadline,
     * the penalty amount is transferred to the non-breaching party.
     *
     * In the prototype: buyer reports breach → penalty goes to seller.
     */
    function reportBreach(uint256 dealId)
        external
        onlyParty(dealId)
        inState(dealId, DealState.Active)
    {
        Deal storage deal = deals[dealId];
        deal.state = DealState.Breached;
        deal.breachedAt = block.timestamp;

        uint256 penaltyAmount = 0;

        // If stake was provided, calculate and pay penalty
        if (deal.stake > 0) {
            penaltyAmount = (deal.stake * deal.penaltyPercent) / 100;
            uint256 remainder = deal.stake - penaltyAmount;

            // Penalty goes to the party that did NOT report the breach
            address penaltyRecipient = (msg.sender == deal.buyer)
                ? deal.seller
                : deal.buyer;

            // Transfer penalty
            if (penaltyAmount > 0) {
                (bool penaltySent, ) = penaltyRecipient.call{value: penaltyAmount}("");
                require(penaltySent, "DealLock: Penalty transfer failed");
            }

            // Return remainder to buyer
            if (remainder > 0) {
                (bool remainderSent, ) = deal.buyer.call{value: remainder}("");
                require(remainderSent, "DealLock: Remainder transfer failed");
            }
        }

        emit DealBreached(dealId, msg.sender, penaltyAmount, block.timestamp);
    }

    // ── completeDeal ──────────────────────────────────────────
    /**
     * @notice Buyer marks the deal as successfully completed.
     * Returns any remaining stake to the buyer.
     */
    function completeDeal(uint256 dealId)
        external
        onlyBuyer(dealId)
        inState(dealId, DealState.Active)
    {
        Deal storage deal = deals[dealId];
        deal.state = DealState.Completed;

        // Return stake to buyer
        if (deal.stake > 0) {
            uint256 stakeToReturn = deal.stake;
            deal.stake = 0;
            (bool sent, ) = deal.buyer.call{value: stakeToReturn}("");
            require(sent, "DealLock: Stake return failed");
        }

        emit DealCompleted(dealId, block.timestamp);
    }

    // ── cancelDeal ────────────────────────────────────────────
    /**
     * @notice Either party can cancel a deal that is still Pending.
     * Stake is returned to buyer.
     */
    function cancelDeal(uint256 dealId)
        external
        onlyParty(dealId)
        inState(dealId, DealState.Pending)
    {
        Deal storage deal = deals[dealId];
        deal.state = DealState.Cancelled;

        if (deal.stake > 0) {
            uint256 stakeToReturn = deal.stake;
            deal.stake = 0;
            (bool sent, ) = deal.buyer.call{value: stakeToReturn}("");
            require(sent, "DealLock: Stake return failed");
        }

        emit DealCancelled(dealId, block.timestamp);
    }

    // ── getDeal ───────────────────────────────────────────────
    /**
     * @notice Read a deal's full state.
     */
    function getDeal(uint256 dealId)
        external
        view
        returns (
            address buyer,
            address seller,
            uint256 amount,
            bytes32 termsHash,
            uint256 paymentDeadline,
            uint256 penaltyPercent,
            uint256 stake,
            DealState state,
            uint256 createdAt
        )
    {
        Deal memory d = deals[dealId];
        return (
            d.buyer, d.seller, d.amount, d.termsHash,
            d.paymentDeadline, d.penaltyPercent, d.stake,
            d.state, d.createdAt
        );
    }

    // ── totalDeals ────────────────────────────────────────────
    function totalDeals() external view returns (uint256) {
        return _dealCounter;
    }
}
