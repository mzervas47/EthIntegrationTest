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
    const [latestBlockNumber, setBlockNumber] = useState<number>(0);
    const [walletStatus, setWalletStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle'); 
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [erroMessage, setErrorMessage] = useState<string | null>(null);
    const [signClient, setSignClient] = useState<SignClient | null>(null);
    const [tokenURI, settokenURI] = useState<string>('https://example.com/metadata.json');
    const [mintStatus, setMintStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle'); 
    const [txHash, setTxHash] = useState<string | null>(null);
    const [session, setSession] = useState<any | null>(null);

    const globalProvider = new ethers.JsonRpcProvider(
        `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
    );
    const testProviderConnection = async () => {
        try {
            setProviderStatus('connecting');
            setErrorMessage('null');

            console.log('Creating provider');

            const provider = globalProvider;

            console.log('Got provider');

            console.log('Getting latest block');

            const blockNumber = await provider.getBlockNumber();
            console.log('Latest block number:', blockNumber);
            setBlockNumber(blockNumber);

        } catch (error: any) {
            console.error('Provider error:', error);
            setProviderStatus('error');
            setErrorMessage(`Provider error: ${error.message || 'unknown error'}`);
        }
    };

    const initializeWalletConnect = async () => {
        try {
            const client = await SignClient.init({
                projectId: WALLET_CONNECT_PROJECT_ID,
                metadata: {
                    name: 'PhotoHash Tester App',
                    description: 'Test Web3 API for PhotoHash App',
                    url: '',
                    icons: ['']
                }
            });

            setSignClient(client);
            return client;
        } catch (error: any) {
            console.error('SDK init error:', error);
            setErrorMessage(`SDK init error: ${error.message || 'unknown error'}`);
            return null;
        }
    };

    const connectWallet = async () => {
        try {
            setWalletStatus('connecting');
            setErrorMessage(null);

            const client = signClient || await initializeWalletConnect();
            if (!client) {
                throw new Error('Failed to init SDK')
            }

            const { uri, approval } = await client.connect({
                requiredNamespaces: {
                    eip155: {
                        methods: ['eth_sendTransaction', 'eth_signTransaction', 'personal_sign'],
                        chains: ['eip155:11155111'],
                        events: ['chainChanged', 'accountsChanged']
                    }
                }
            });

            console.log('WalletConnect URI: ', uri);

            if (uri) {
                Linking.openURL(uri);
            } else {
                console.error("No URI available for wallet connection");
            }

            const sessionData = await approval();
            console.log('Session established: ', sessionData);
            setSession(sessionData);

            const accounts = sessionData.namespaces.eip155?.accounts || [];
            if (accounts.length > 0) {
                const address = accounts[0].split(':')[2];
                setWalletAddress(address);
                setWalletStatus('connected');
            } else {
                throw new Error('No accounts found in session');
            }
        } catch (error: any) {
            console.error('Wallet connection error');
            setWalletStatus('error');
            setErrorMessage(`Wallet connection error: ${error.message || 'Unknown error'}`);
        }
    };

    const creatContract = async () => {
        try {
            const provider = globalProvider;
            if (!provider) {
                throw new Error ('No provider available');
            }

            console.log('Creating contract instance');

            const contract = new ethers.Contract(
                SEPOLIA_TEST_CONTRACT_ADDRESS_TWO,
                NFT_CONTRACT_ABI,
                provider
            );

            console.log('Calling get Mint Price');

            const mintPrice = await contract.MINT_PRICE();
            const blockNumber = latestBlockNumber;

            setContractData({
                mintPrice: ethers.formatEther(mintPrice),
                blockNumber,
            });

            return contract;

        } catch (error: any) {
            console.error('Contract error', error);
            return null;
        }
    };
}


