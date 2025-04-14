import { ethers } from 'ethers';

export const prepareMintTransactionData = (tokenURI: string, abi: string[]) => {
  const iface = new ethers.Interface(abi);
  const data = iface.encodeFunctionData('mintNFT', [tokenURI]);
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

  let mintPrice;
  if (provider) {
    mintPrice = await getMintPrice(provider, contractAddress, abi);
  } else {
    mintPrice = ethers.parseEther('0.01');
  }

  const tx = {
    from: walletAddress,
    to: contractAddress,
    data: data,
    value: mintPrice.toString(),
  };

  return { tx, data, mintPrice };
};
