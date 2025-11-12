import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";

// Soneium Minato Testnet
const soneiumMinato = {
  id: 1946,
  name: 'Soneium Minato',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.minato.soneium.org'] },
  },
  blockExplorers: {
    default: { name: 'Soneium Minato Explorer', url: 'https://soneium-minato.blockscout.com' },
  },
  testnet: true,
} as const;

export const config = createConfig({
  chains: [soneiumMinato],
  connectors: [
    injected(),
  ],
  transports: {
    [soneiumMinato.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}