import { Page } from '@playwright/test';
import { Wallet } from 'ethers';

export interface WalletInfo {
  address: string;
  privateKey: string;
}

interface WalletProviderInfo {
  uuid: string;
  name: string;
  rdns: string;
  flags: Record<string, boolean>;
}

/**
 * All supported EVM wallet types.
 * Keys are used as `EvmWalletType`, values contain EIP-6963 provider info.
 */
export const WALLET_PROVIDERS = {
  // --- Original 4 wallets ---
  'metamask': {
    uuid: 'mock-metamask-uuid',
    name: 'MetaMask',
    rdns: 'io.metamask',
    flags: { isMetaMask: true },
  },
  'hero-wallet': {
    uuid: 'mock-herowallet-uuid',
    name: 'Hero Wallet',
    rdns: 'app.aspect.herowallet',
    flags: {},
  },
  'binance-wallet': {
    uuid: 'mock-binance-uuid',
    name: 'Binance Wallet',
    rdns: 'com.binance.w3w',
    flags: { isBinance: true },
  },
  'trust-wallet': {
    uuid: 'mock-trust-uuid',
    name: 'Trust Wallet',
    rdns: 'com.trustwallet.app',
    flags: { isTrust: true, isTrustWallet: true },
  },

  // --- WalletConnect certified wallets ---
  // 'safepal': {
  //   uuid: 'mock-safepal-uuid',
  //   name: 'SafePal',
  //   rdns: 'app.safepal',
  //   flags: { isSafePal: true },
  // },
  // 'fireblocks': {
  //   uuid: 'mock-fireblocks-uuid',
  //   name: 'Fireblocks',
  //   rdns: 'com.fireblocks',
  //   flags: {},
  // },
  // 'okx-wallet': {
  //   uuid: 'mock-okx-uuid',
  //   name: 'OKX Wallet',
  //   rdns: 'com.okex.wallet',
  //   flags: { isOKExWallet: true },
  // },
  // 'tokenpocket': {
  //   uuid: 'mock-tokenpocket-uuid',
  //   name: 'TokenPocket',
  //   rdns: 'pro.tokenpocket',
  //   flags: { isTokenPocket: true },
  // },
  // 'bitget-wallet': {
  //   uuid: 'mock-bitget-uuid',
  //   name: 'Bitget Wallet',
  //   rdns: 'com.bitget.web3',
  //   flags: { isBitKeep: true },
  // },
  // 'uniswap-wallet': {
  //   uuid: 'mock-uniswap-uuid',
  //   name: 'Uniswap Wallet',
  //   rdns: 'org.uniswap',
  //   flags: {},
  // },
  // 'ledger-live': {
  //   uuid: 'mock-ledger-uuid',
  //   name: 'Ledger Live',
  //   rdns: 'com.ledger.live',
  //   flags: { isLedger: true },
  // },
  // 'zerion': {
  //   uuid: 'mock-zerion-uuid',
  //   name: 'Zerion',
  //   rdns: 'io.zerion.wallet',
  //   flags: { isZerion: true },
  // },
  // 'best-wallet': {
  //   uuid: 'mock-bestwallet-uuid',
  //   name: 'Best Wallet',
  //   rdns: 'io.bestwallet',
  //   flags: {},
  // },
  // 'crypto-com': {
  //   uuid: 'mock-cryptocom-uuid',
  //   name: 'Crypto.com Onchain',
  //   rdns: 'com.crypto.wallet',
  //   flags: {},
  // },
  // 'bifrost-wallet': {
  //   uuid: 'mock-bifrost-uuid',
  //   name: 'Bifrost Wallet',
  //   rdns: 'io.bifrostwallet',
  //   flags: {},
  // },
  // 'xportal': {
  //   uuid: 'mock-xportal-uuid',
  //   name: 'xPortal',
  //   rdns: 'com.multiversx.xportal',
  //   flags: {},
  // },
  // 'bitcoin-com': {
  //   uuid: 'mock-bitcoincom-uuid',
  //   name: 'Bitcoin.com Wallet',
  //   rdns: 'com.bitcoin.wallet',
  //   flags: {},
  // },
  // '1inch-wallet': {
  //   uuid: 'mock-1inch-uuid',
  //   name: '1inch Wallet',
  //   rdns: 'io.1inch.wallet',
  //   flags: { isOneInch: true },
  // },
  // 'trezor-suite': {
  //   uuid: 'mock-trezor-uuid',
  //   name: 'Trezor Suite',
  //   rdns: 'io.trezor.suite',
  //   flags: {},
  // },
  // 'blockchain-com': {
  //   uuid: 'mock-blockchaincom-uuid',
  //   name: 'Blockchain.com',
  //   rdns: 'com.blockchain.wallet',
  //   flags: {},
  // },
  // 'imtoken': {
  //   uuid: 'mock-imtoken-uuid',
  //   name: 'imToken',
  //   rdns: 'im.token.app',
  //   flags: { isImToken: true },
  // },
  // 'bitpay-wallet': {
  //   uuid: 'mock-bitpay-uuid',
  //   name: 'BitPay Wallet',
  //   rdns: 'com.bitpay.wallet',
  //   flags: {},
  // },
  // 'gemini': {
  //   uuid: 'mock-gemini-uuid',
  //   name: 'Gemini',
  //   rdns: 'com.gemini.wallet',
  //   flags: {},
  // },
  // 'arculus-wallet': {
  //   uuid: 'mock-arculus-uuid',
  //   name: 'Arculus Wallet',
  //   rdns: 'com.arculus.wallet',
  //   flags: {},
  // },
  // 'ctrl-wallet': {
  //   uuid: 'mock-ctrl-uuid',
  //   name: 'Ctrl Wallet',
  //   rdns: 'app.ctrl',
  //   flags: {},
  // },
  // 'ronin-wallet': {
  //   uuid: 'mock-ronin-uuid',
  //   name: 'Ronin Wallet',
  //   rdns: 'com.roninchain.wallet',
  //   flags: { isRonin: true },
  // },
  // 'safe': {
  //   uuid: 'mock-safe-uuid',
  //   name: 'Safe',
  //   rdns: 'io.gnosis.safe',
  //   flags: {},
  // },
} as const satisfies Record<string, WalletProviderInfo>;

export type EvmWalletType = keyof typeof WALLET_PROVIDERS;

/**
 * Returns the RDNS identifier for a given wallet type.
 * Used by LoginPage to construct the `wallet-selector-{rdns}` testId.
 */
export function getWalletRdns(walletType: EvmWalletType): string {
  return WALLET_PROVIDERS[walletType].rdns;
}

/**
 * Injects a custom `window.ethereum` provider into the page.
 * Uses a real ethers.js wallet for cryptographically valid signatures.
 * Supports different wallet types via EIP-6963 announcement.
 *
 * Must be called BEFORE page.goto() so the dApp detects the wallet on load.
 */
export async function injectEthereumMock(page: Page, wallet?: WalletInfo, walletType: EvmWalletType = 'metamask'): Promise<WalletInfo> {
  const w = wallet ?? generateWallet();
  const providerInfo = WALLET_PROVIDERS[walletType];

  // Expose a Node.js signing function to the browser context.
  // The browser mock calls this for personal_sign — the signature is real.
  await page.exposeFunction('__ethSignMessage', async (message: string) => {
    const signer = new Wallet(w.privateKey);
    return signer.signMessage(message);
  });

  // Inject window.ethereum mock before any page script runs
  await page.addInitScript(({ address, provider }: { address: string; provider: WalletProviderInfo }) => {
    const listeners: Record<string, Array<(...args: unknown[]) => void>> = {};

    const ethProvider: Record<string, unknown> = {
      isConnected: () => true,
      chainId: '0x1',
      networkVersion: '1',
      selectedAddress: address,
      ...provider.flags,

      request: async ({ method, params }: { method: string; params?: unknown[] }) => {
        switch (method) {
          case 'eth_requestAccounts':
          case 'eth_accounts':
            return [address];

          case 'eth_chainId':
            return '0x1';

          case 'net_version':
            return '1';

          case 'personal_sign': {
            const hexMsg = (params as string[])[0];
            const msg = hexMsg.startsWith('0x')
              ? Array.from(
                  { length: (hexMsg.length - 2) / 2 },
                  (_, i) => String.fromCharCode(parseInt(hexMsg.slice(2 + i * 2, 4 + i * 2), 16))
                ).join('')
              : hexMsg;
            console.log(`[SIWE:${provider.name}] ${msg}`);
            return (window as any).__ethSignMessage(msg);
          }

          case 'eth_sign': {
            const msg = (params as string[])[1];
            return (window as any).__ethSignMessage(msg);
          }

          case 'wallet_switchEthereumChain':
            return null;

          case 'wallet_addEthereumChain':
            return null;

          case 'eth_getBalance':
            return '0x0';

          case 'eth_blockNumber':
            return '0x1';

          case 'eth_estimateGas':
            return '0x5208';

          default:
            console.warn(`[EthereumMock:${provider.name}] Unhandled method: ${method}`);
            return null;
        }
      },

      on: (event: string, handler: (...args: unknown[]) => void) => {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(handler);
      },

      removeListener: (event: string, handler: (...args: unknown[]) => void) => {
        if (listeners[event]) {
          listeners[event] = listeners[event].filter(h => h !== handler);
        }
      },

      removeAllListeners: () => {
        Object.keys(listeners).forEach(k => delete listeners[k]);
      },

      emit: (event: string, ...args: unknown[]) => {
        (listeners[event] || []).forEach(h => h(...args));
      },
    };

    (window as any).ethereum = ethProvider;

    // EIP-6963: announce provider immediately and also respond to future requests
    const announceDetail = {
      info: {
        uuid: provider.uuid,
        name: provider.name,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
        rdns: provider.rdns,
      },
      provider: ethProvider,
    };

    const announce = () => {
      window.dispatchEvent(
        new CustomEvent('eip6963:announceProvider', { detail: announceDetail })
      );
    };

    announce();

    window.addEventListener('eip6963:requestProvider', () => {
      announce();
    });
  }, { address: w.address, provider: providerInfo });

  return w;
}

/**
 * Generates a random Ethereum wallet.
 */
export function generateWallet(): WalletInfo {
  const wallet = Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
}
