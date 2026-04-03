import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";

describe("PaymentRouter", async function () {
  const { viem } = await network.connect();
  const walletClients = await viem.getWalletClients();

  it("tracks balances after processing a payment", async function () {
    const router = await viem.deployContract("PaymentRouter");
    const [fromAgent, toAgent] = walletClients;

    await router.write.processPayment([
      fromAgent.account.address,
      toAgent.account.address,
      5000n,
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    ]);

    const balance = await router.read.getAgentBalance([toAgent.account.address]);
    assert.equal(balance, 5000n);
  });
});
