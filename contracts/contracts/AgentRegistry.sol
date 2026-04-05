// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract AgentRegistry {
  struct Agent {
    string ensName;
    bytes32 nullifierHash;
    bytes32 agentKitCredential;
    string[] capabilities;
    uint256 pricePerRequest;
    bool active;
  }

  mapping(string => Agent) private agents;
  mapping(bytes32 => uint256) private agentCountByNullifier;
  string[] private agentNames;

  event AgentRegistered(
    string ensName,
    bytes32 indexed nullifierHash,
    bytes32 indexed agentKitCredential,
    uint256 pricePerRequest
  );
  event AgentDeactivated(string ensName);

  function registerAgent(
    string calldata ensName,
    bytes32 nullifierHash,
    bytes32 agentKitCredential,
    string[] calldata capabilities,
    uint256 pricePerRequest
  ) external {
    require(bytes(ensName).length > 0, "AgentRegistry: empty ENS name");
    require(
      agents[ensName].nullifierHash == bytes32(0),
      "AgentRegistry: agent already exists"
    );
    require(
      agentCountByNullifier[nullifierHash] < 5,
      "AgentRegistry: max 5 agents per human"
    );

    Agent storage agent = agents[ensName];
    agent.ensName = ensName;
    agent.nullifierHash = nullifierHash;
    agent.agentKitCredential = agentKitCredential;
    agent.pricePerRequest = pricePerRequest;
    agent.active = true;

    for (uint256 i = 0; i < capabilities.length; i++) {
      agent.capabilities.push(capabilities[i]);
    }

    agentNames.push(ensName);
    agentCountByNullifier[nullifierHash] += 1;

    emit AgentRegistered(
      ensName,
      nullifierHash,
      agentKitCredential,
      pricePerRequest
    );
  }

  function verifyWorldID(
    uint256 root,
    uint256 nullifierHash,
    uint256[8] calldata proof
  ) external pure returns (bool) {
    uint256 checksum = 0;

    for (uint256 i = 0; i < proof.length; i++) {
      checksum |= proof[i];
    }

    return root != 0 && nullifierHash != 0 && checksum != 0;
  }

  function getAgentCount(bytes32 nullifierHash) external view returns (uint256) {
    return agentCountByNullifier[nullifierHash];
  }

  function getAgent(
    string calldata ensName
  ) external view returns (Agent memory) {
    return agents[ensName];
  }

  address private owner;

  constructor() {
    owner = msg.sender;
  }

  function deactivateAgent(string calldata ensName) external {
    require(
      msg.sender == owner,
      "AgentRegistry: only owner can deactivate"
    );
    require(
      agents[ensName].nullifierHash != bytes32(0),
      "AgentRegistry: unknown agent"
    );

    agents[ensName].active = false;
    emit AgentDeactivated(ensName);
  }

  function isVerifiedAgent(string calldata ensName) external view returns (bool) {
    Agent storage agent = agents[ensName];
    return agent.active && agent.nullifierHash != bytes32(0);
  }

  function getAllAgents() external view returns (Agent[] memory) {
    Agent[] memory result = new Agent[](agentNames.length);

    for (uint256 i = 0; i < agentNames.length; i++) {
      result[i] = agents[agentNames[i]];
    }

    return result;
  }
}
