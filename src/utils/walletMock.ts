import { Page } from '@playwright/test';
import { Wallet } from 'ethers';

export interface WalletInfo {
  address: string;
  privateKey: string;
}

/**
 * Injects a custom `window.ethereum` provider into the page that behaves like MetaMask.
 * Uses a real ethers.js wallet for cryptographically valid signatures.
 *
 * Must be called BEFORE page.goto() so the dApp detects MetaMask on load.
 */
export async function injectEthereumMock(page: Page, wallet?: WalletInfo): Promise<WalletInfo> {
  const w = wallet ?? generateWallet();

  // Expose a Node.js signing function to the browser context.
  // The browser mock calls this for personal_sign — the signature is real.
  await page.exposeFunction('__ethSignMessage', async (message: string) => {
    const signer = new Wallet(w.privateKey);
    return signer.signMessage(message);
  });

  // Inject window.ethereum mock before any page script runs
  await page.addInitScript((address: string) => {
    const listeners: Record<string, Array<(...args: unknown[]) => void>> = {};

    (window as any).ethereum = {
      isMetaMask: true,
      isConnected: () => true,
      chainId: '0x1',
      networkVersion: '1',
      selectedAddress: address,

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
            // params[0] = hex-encoded message, params[1] = address
            const hexMsg = (params as string[])[0];
            // Convert hex to UTF-8 string for ethers signMessage
            const msg = hexMsg.startsWith('0x')
              ? Array.from(
                  { length: (hexMsg.length - 2) / 2 },
                  (_, i) => String.fromCharCode(parseInt(hexMsg.slice(2 + i * 2, 4 + i * 2), 16))
                ).join('')
              : hexMsg;
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
            console.warn(`[EthereumMock] Unhandled method: ${method}`);
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

    // EIP-6963: announce provider immediately and also respond to future requests
    const announceDetail = {
      info: {
        uuid: 'mock-metamask-uuid',
        name: 'MetaMask',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
        rdns: 'io.metamask',
      },
      provider: (window as any).ethereum,
    };

    const announce = () => {
      window.dispatchEvent(
        new CustomEvent('eip6963:announceProvider', { detail: announceDetail })
      );
    };

    // Announce immediately on page load
    announce();

    // Re-announce whenever the dApp requests providers (e.g. when wallet modal opens)
    window.addEventListener('eip6963:requestProvider', () => {
      announce();
    });
  }, w.address);

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
