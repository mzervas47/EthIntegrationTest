import { ethers } from 'ethers';
import {
  ALCHEMY_API_KEY,
  SEPOLIA_TEST_CONTRACT_ADDRESS_TWO,
  WALLET_CONNECT_PROJECT_ID,
} from '@env';

export const NFT_CONTRACT_ABI = [
  'function mintNFT(string memory tokenURI_) public payable',
  'function tokenURI(uint256 tokenId) public view returns (string memory)',
  'function MINT_PRICE() public view returns (uint256)',
  'function withdraw(address payable recipient) public',
  'function ownerOf(uint256 tokenId) public view returns (address)',
];

export const globalProvider = new ethers.JsonRpcProvider(
  `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
);
