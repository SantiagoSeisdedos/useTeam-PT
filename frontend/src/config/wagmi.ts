import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  avalanche,
} from "wagmi/chains";
import { WALLETCONNECT_PROJECT_ID } from "./api";

export const config = getDefaultConfig({
  appName: "Kanban Colaborativo",
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: [mainnet, polygon, optimism, arbitrum, base, avalanche],
  ssr: false,
});
