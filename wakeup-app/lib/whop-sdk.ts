import { WhopServerSdk } from "@whop/api";

export const whopsdk = WhopServerSdk({
  appApiKey: process.env.WHOP_API_KEY as string,
  appId: process.env.NEXT_PUBLIC_WHOP_APP_ID as string,
});
