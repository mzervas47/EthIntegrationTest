import { ethers } from 'ethers';
import {
  ALCHEMY_API_KEY,
} from '@env';

export const NFT_CONTRACT_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'function mintNFT(string) external payable',
  'function tokenURI(uint256) public view returns (string memory)',
  'function MINT_PRICE() external view returns (uint256)',
  'function withdraw() external',
  'function ownerOf(uint256) public view returns (address)',
];

export const globalProvider = new ethers.JsonRpcProvider(
  `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
);
