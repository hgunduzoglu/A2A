export function getMiniKitContext() {
  return {
    appId: process.env.NEXT_PUBLIC_APP_ID ?? '',
    actionId: process.env.NEXT_PUBLIC_ACTION_ID ?? '',
  };
}
