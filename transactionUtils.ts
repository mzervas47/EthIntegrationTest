import { ethers } from 'ethers';

export const prepareMintTransactionData = (tokenURI: string, abi: string[]) => {
  const iface = new ethers.Interface(abi);
  const data = iface.encodeFunctionData('mintNFT(string)', [tokenURI]);
  return data;
};

export const getMintPrice = async (
  provider: ethers.JsonRpcProvider,
  contractAddress: string,
  abi: string[]
) => {
  try {
    const contract = new ethers.Contract(contractAddress, abi, provider);
    return await contract.MINT_PRICE();
  } catch (error) {
    console.warn("Couldn't get MINT_PRICE from contract, using default", error);
    return ethers.parseEther('0.01');
  }
};

export const buildMintTransaction = async (
  provider: ethers.JsonRpcProvider,
  walletAddress: string,
  tokenURI: string,
  contractAddress: string,
  abi: string[]
) => {
  const data = prepareMintTransactionData(tokenURI, abi);

  const fallback = ethers.parseEther('0.01');
  const mintPrice = provider ? await getMintPrice(provider, contractAddress, abi) : fallback;

  const mintValueHex = '0x' + mintPrice.toString(16);

  const tx = {
    from: walletAddress,
    to: contractAddress,
    data: data,
    value: mintValueHex,
  };

  return { tx, data, mintPrice };
};

export const extractTokenId = async (
  txHash: string,
  provider: ethers.JsonRpcProvider,
  contractAbi: string []
) => {
  try {
    const receipt = await provider.waitForTransaction(txHash);

    if (!receipt || receipt.status !== 1) {
      throw new Error('Transaction failed or not found');
    }

    const iface = new ethers.Interface(contractAbi);

    for (const log of receipt.logs) {
      try {
        const parsedLog = iface.parseLog({
          topics: log.topics,
          data: log.data,
        });

        if (parsedLog && parsedLog.name === 'Transfer') {
          if (parsedLog.args[0] === ethers.ZeroAddress) {
            const tokenId = parsedLog.args[2].toString();
            return tokenId;
          }
        }
      } catch (e) {
        continue;
      }
    }

    throw new Error('Transfer event not found');
  } catch (error) {
    throw new Error('Failed to extract Token ID');
  }
};
