const { TronWeb } = require('tronweb');

const NILE_FULL_HOST = 'https://nile.trongrid.io';

export async function sendUsdtOnNile(toAddress: string, amount: number): Promise<string> {
    const privateKey = process.env.TRON_SENDER_PRIVATE_KEY;
    const usdtContract = process.env.TRON_NILE_USDT_CONTRACT;

    if (!privateKey) throw new Error('TRON_SENDER_PRIVATE_KEY is not set in env');
    if (!usdtContract) throw new Error('TRON_NILE_USDT_CONTRACT is not set in env');

    const tronWeb = new TronWeb({
        fullHost: NILE_FULL_HOST,
        privateKey,
    });

    const contract = await tronWeb.contract().at(usdtContract);
    const amountInSun = Math.round(amount * 1_000_000); // USDT has 6 decimals

    const txHash = await contract.transfer(toAddress, amountInSun).send({
        feeLimit: 100_000_000,
    });

    console.log(`[tronNile] Sent ${amount} USDT to ${toAddress}, txHash: ${txHash}`);
    return txHash;
}
