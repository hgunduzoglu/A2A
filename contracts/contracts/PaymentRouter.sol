// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract PaymentRouter {
  mapping(address => uint256) private balances;

  event PaymentProcessed(
    address indexed fromAgent,
    address indexed toAgent,
    uint256 amount,
    bytes32 indexed serviceId
  );
  event Withdrawal(address indexed agent, uint256 amount);

  function processPayment(
    address fromAgent,
    address toAgent,
    uint256 amount,
    bytes32 serviceId
  ) external {
    require(toAgent != address(0), "PaymentRouter: invalid recipient");
    require(amount > 0, "PaymentRouter: amount must be positive");

    balances[toAgent] += amount;

    emit PaymentProcessed(fromAgent, toAgent, amount, serviceId);
  }

  function getAgentBalance(address agent) external view returns (uint256) {
    return balances[agent];
  }

  function withdraw(address agent) external returns (uint256 amount) {
    amount = balances[agent];
    require(amount > 0, "PaymentRouter: nothing to withdraw");

    balances[agent] = 0;
    emit Withdrawal(agent, amount);
  }
}
