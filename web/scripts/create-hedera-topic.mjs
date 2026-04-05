import {
  AccountId,
  Client,
  PrivateKey,
  TopicCreateTransaction,
} from '@hashgraph/sdk';

function getConfig() {
  return {
    accountId: process.env.HEDERA_ACCOUNT_ID,
    privateKey: process.env.HEDERA_PRIVATE_KEY,
    network: process.env.HEDERA_NETWORK ?? 'testnet',
  };
}

function createClient({ accountId, privateKey, network }) {
  const client =
    network === 'mainnet'
      ? Client.forMainnet()
      : network === 'previewnet'
        ? Client.forPreviewnet()
        : Client.forTestnet();

  client.setOperator(
    AccountId.fromString(accountId),
    PrivateKey.fromString(privateKey),
  );

  return client;
}

async function main() {
  const config = getConfig();

  if (!config.accountId || !config.privateKey) {
    throw new Error('HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY are required.');
  }

  const client = createClient(config);

  try {
    const transaction = await new TopicCreateTransaction()
      .setTopicMemo('A2A service completion log')
      .execute(client);
    const receipt = await transaction.getReceipt(client);

    if (!receipt.topicId) {
      throw new Error('Topic creation succeeded but no topicId was returned.');
    }

    console.log(receipt.topicId.toString());
  } finally {
    client.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
