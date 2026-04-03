import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";

describe("AgentRegistry", async function () {
  const { viem } = await network.connect();

  it("stores registered agents", async function () {
    const registry = await viem.deployContract("AgentRegistry");
    const agentName = "marketanalyzer.a2a.eth";

    await registry.write.registerAgent([
      agentName,
      "0x1111111111111111111111111111111111111111111111111111111111111111",
      "0x2222222222222222222222222222222222222222222222222222222222222222",
      ["market-analysis", "sentiment"],
      5000n,
    ]);

    const agent = await registry.read.getAgent([agentName]);
    assert.equal(agent.ensName, agentName);
    assert.equal(agent.pricePerRequest, 5000n);
    assert.equal(agent.active, true);
    assert.equal(agent.capabilities.length, 2);
  });
});
