import { createWeb3Modal, defaultConfig } from "@web3modal/ethers";
import { JsonRpcProvider } from "ethers";

import TOKEN_LOGOS from "@src/constants/tokenLogos";
import { Token } from "@src/entity";

import TOKENS_JSON from "./tokens.json";

export const CONTRACT_ADDRESSES = {
  spotMarket: "0x6326d3AF2612a45F054D05f9cFf60B37338a59c0",
  tokenFactory: "0xc3d0426df8a40e7b4803f305537a83e7037be91596c393e7a6b693133f9d7301",
  pyth: "0x2b480dd77abdc48224a22b809608b445604f0de1a999160fb7f126cca2ffc108",
  proxy: "0x36eadaee6e25bd050239834703f3881f91cbc3cb3bb7c96f57483703d8ecba3f",
  accountBalance: "0xcfa7a1e1030c7aaf97fc065dab030fd4d6afd75dc80d35a3b843f0c467f69a2f",
  clearingHouse: "0x0815f30454fe7bafec5b137513a8d1dcb36a4ffa5530217d7e6381352fb2614b",
  insuranceFund: "0x7cdf5bd4cd5b9584517bee34b5fc94abe4790b1e99f1a7f81f40ef824164d103",
  perpMarket: "0x87f7c3ef8c5b36696021c1e355f8946f36a156dfc66d44fd276e35aa950f008e",
  vault: "0xfa8f7e7b7ed37ce7b0b98ac832317298aadb1a3833c5eec7899429c75124762f",
};

export interface Network {
  name: string;
  rpc: string;
  chainId: string;
  explorer: string;
  currency: string;
}

export const NETWORKS: Network[] = [
  {
    name: "Arbitrum Sepolia",
    rpc: "https://arbitrum-sepolia.infura.io/v3/c9c23a966a0e4064b925cb2d6783e679",
    chainId: "421614",
    explorer: "https://sepolia.arbiscan.io",
    currency: "ETH",
  },
];

export const PROVIDERS: Record<string, JsonRpcProvider> = NETWORKS.reduce((providers, network) => {
  return {
    ...providers,
    [network.chainId]: new JsonRpcProvider(network.rpc),
  };
}, {});

// TODO: Need to fix logic. Should be inside networks
export const EXPLORER_URL = "https://sepolia.arbiscan.io";

export const TOKENS_LIST: Token[] = Object.values(TOKENS_JSON).map(
  ({ name, symbol, decimals, assetId, priceFeed }) =>
    new Token({
      name,
      symbol,
      decimals,
      assetId,
      logo: TOKEN_LOGOS[symbol],
      priceFeed,
    }),
);

export const TOKENS_BY_SYMBOL: Record<string, Token> = TOKENS_LIST.reduce((acc, t) => ({ ...acc, [t.symbol]: t }), {});

export const TOKENS_BY_ASSET_ID: Record<string, Token> = TOKENS_LIST.reduce(
  (acc, t) => ({ ...acc, [t.assetId.toLowerCase()]: t }),
  {},
);

export const WEB3_MODAL_PROJECT_ID = "44156c54a1b842a095507783c40d667b";

const chains = NETWORKS.map((network) => ({
  chainId: Number(network.chainId),
  name: network.name,
  currency: network.currency,
  explorerUrl: network.explorer,
  rpcUrl: network.rpc,
}));

const metadata = {
  name: "Spark",
  description: "A Decentralized Order Book on Fuel.Network",
  url: "https://app.sprk.fi",
  icons: ["https://app.sprk.fi/"],
};

export const web3Modal = createWeb3Modal({
  ethersConfig: defaultConfig({ metadata }),
  chains,
  projectId: WEB3_MODAL_PROJECT_ID,
  enableAnalytics: true,
  defaultChain: chains[0],
});
