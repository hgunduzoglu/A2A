import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("RegistryOnlyModule", (m) => {
  const agentRegistry = m.contract("AgentRegistry");

  return { agentRegistry };
});
