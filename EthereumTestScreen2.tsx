import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  TextInput,
} from 'react-native';
import { ethers } from 'ethers';
import SignClient from '@walletconnect/sign-client';
import {
  ALCHEMY_API_KEY,
  SEPOLIA_TEST_CONTRACT_ADDRESS_TWO,
  WALLET_CONNECT_PROJECT_ID,
} from '@env';

const NFT_CONTRACT_ABI = [
  'function mint(string memory tokenURI_) public payable',
  'function tokenURI(uint256 tokenId) public view returns (string memory)',
  'function MINT_PRICE() public view returns (uint256)',
  'function withdraw(address payable recipient) public',
  'function ownerOf(uint256 tokenId) public view returns (address)',
];

const EtheruemTestScreenTwo: React.FC = () => {
    const [providerStatus, setProviderStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
    const [contractData, setContractData] = useState<any>(null);
    const [walletStatus, setWalletStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle'); 
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [erroMessage, setErrorMessage] = useState<string | null>(null);
    const [signClient, setSignClient] = useState<SignClient | null>(null);
    const [tokenURI, settokenURI] = useState<string>('https://example.com/metadata.json');
    const [mintStatus, setMintStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle'); 
    const [txHash, setTxHash] = useState<string | null>(null);
    const [session, setSession] = useState<any | null>(null);
}
