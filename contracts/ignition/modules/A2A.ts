import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("A2AModule", (m) => {
  const agentRegistry = m.contract("AgentRegistry");
  const paymentRouter = m.contract("PaymentRouter");

  return { agentRegistry, paymentRouter };
});
