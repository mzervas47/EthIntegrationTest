import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  TextInput,
} from 'react-native';
import { ethers } from 'ethers';
import SignClient from '@walletconnect/sign-client';
import { SEPOLIA_TEST_CONTRACT_ADDRESS_TWO, WALLET_CONNECT_PROJECT_ID } from '@env';
import { styles } from './styles';
import { globalProvider, NFT_CONTRACT_ABI } from './config';
import { EstimationSection, EstimationProps } from './EstimationSection';

const EthereumTestScreen2: React.FC = () => {
  const [providerStatus, setProviderStatus] = useState<
    'idle' | 'connecting' | 'connected' | 'error'
  >('idle');
  const [contractData, setContractData] = useState<any>(null);
  const [latestBlockNumber, setBlockNumber] = useState<number>(0);
  const [walletStatus, setWalletStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>(
    'idle'
  );
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [signClient, setSignClient] = useState<SignClient | null>(null);
  const [tokenURI, setTokenURI] = useState<string>('https://example.com/metadata.json');
  const [mintStatus, setMintStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [contractCreated, setContractCreated] = useState<boolean>(false);

  type ErrorType = 'provider' | 'SDK' | 'wallet' | 'contract' | 'mint';

  type ErrorState = {
    provider: string | null;
    SDK: string | null;
    wallet: string | null;
    contract: string | null;
    mint: string | null;
  };

  const [errors, setErrors] = useState<ErrorState>({
    provider: null,
    SDK: null,
    wallet: null,
    contract: null,
    mint: null,
  });

  const setError = (type: ErrorType, message: string) => {
    setErrors((prev) => ({
      ...prev,
      [type]: message,
    }));
  };

  const clearError = (type: ErrorType) => {
    setErrors((prev) => ({
      ...prev,
      [type]: null,
    }));
  };

  const onEstimationError = (message: string) => {
    setError('mint', message);
  };

  const estimationProps: EstimationProps = {
    walletAddress: walletAddress,
    tokenURI: tokenURI,
    contractCreated: contractCreated,
    onEstimationError: onEstimationError,
  };

  const canMint =
    walletStatus === 'connected' &&
    contractCreated &&
    tokenURI.trim().length > 0 &&
    mintStatus !== 'pending';

  const testProviderConnection = async () => {
    try {
      clearError('provider');
      setProviderStatus('connecting');

      console.log('Creating provider');

      const provider = globalProvider;

      console.log('Got provider');

      console.log('Getting latest block');

      const blockNumber = await provider.getBlockNumber();

      setBlockNumber(blockNumber);

      console.log('Latest block number:', blockNumber);

      setProviderStatus('connected');
    } catch (error: any) {
      console.error('Provider error:', error);

      setError('provider', error.message || 'Unknown error');

      setProviderStatus('error');
    }
  };

  const initializeWalletConnect = async () => {
    clearError('SDK');
    try {
      const client = await SignClient.init({
        projectId: WALLET_CONNECT_PROJECT_ID,
        metadata: {
          name: 'PhotoHash Tester App',
          description: 'Test Web3 API for PhotoHash App',
          url: 'https://reown.com/',
          icons: ['https://walletconnect.com/walletconnect-logo.png'],
        },
      });

      setSignClient(client);
      return client;
    } catch (error: any) {
      console.error('SDK init error:', error);
      setError('SDK', error.message || 'Unknown error');
      return null;
    }
  };

  const connectWallet = async () => {
    try {
      clearError('wallet');
      setWalletStatus('connecting');

      const client = signClient || (await initializeWalletConnect());
      if (!client) {
        throw new Error('Failed to init SDK');
      }

      const { uri, approval } = await client.connect({
        requiredNamespaces: {
          eip155: {
            methods: ['eth_sendTransaction', 'eth_signTransaction', 'personal_sign'],
            chains: ['eip155:11155111'],
            events: ['chainChanged', 'accountsChanged'],
          },
        },
      });

      console.log('WalletConnect URI: ', uri);

      if (uri) {
        Linking.openURL(uri);
      } else {
        console.error('No URI available for wallet connection');
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
      console.error('Wallet connection error - FULL ERROR:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      setError('wallet', error.message || 'Unknown error');
      setWalletStatus('error');
    }
  };

  const creatContract = async () => {
    clearError('contract');
    try {
      const provider = globalProvider;
      if (!provider) {
        throw new Error('No provider available');
      }

      console.log('Creating contract instance');

      const contract = new ethers.Contract(
        SEPOLIA_TEST_CONTRACT_ADDRESS_TWO,
        NFT_CONTRACT_ABI,
        provider
      );

      console.log('Calling get Mint Price');

      const mintPrice = await contract.MINT_PRICE();
      const blockNumber = await provider.getBlockNumber();

      setContractData({
        mintPrice: ethers.formatEther(mintPrice),
        blockNumber,
      });

      setContractCreated(true);

      return contract;
    } catch (error: any) {
      console.error('Contract error', error);
      setError('contract', error.message || 'unknown error');
      return null;
    }
  };

  const mintNFT = async () => {
    clearError('mint');

    try {
      if (!signClient || !session || !walletAddress) {
        throw new Error('Wallet not connected');
      }

      setMintStatus('pending');

      const contract = new ethers.Interface(NFT_CONTRACT_ABI);

      const data = contract.encodeFunctionData('mintNFT', [tokenURI]);

      const value = ethers.parseEther('0.01');

      console.log('Transaction to send:', {
        from: walletAddress,
        to: SEPOLIA_TEST_CONTRACT_ADDRESS_TWO,
        data: data,
        value: value.toString(),
      });

      const tx = {
        from: walletAddress,
        to: SEPOLIA_TEST_CONTRACT_ADDRESS_TWO,
        data: data,
        value: value.toString(),
        gasLimit: '0x' + (300000).toString(16),
        maxFeePerGas: '0x' + (5000000000).toString(16),
      };

      const chainId = session.namespaces.eip155.chains[0].split(':')[1];
      console.log('Chain ID being used:', chainId);

      console.log('Before request call, session topic:', session.topic);
      try {
        const result = (await signClient.request({
          topic: session.topic,
          chainId: `eip155:${chainId}`,
          request: {
            method: 'eth_sendTransaction',
            params: [tx],
          },
        })) as string;
        console.log('After request call, result:', result);
        console.log('Transaction hash:', result);
        setTxHash(result);
        setMintStatus('success');
      } catch (error) {
        console.error('Request call failed:', error);
      }
    } catch (error: any) {
      console.error('Minting error:', error);
      setError('mint', error.message || 'unknown error');
      setMintStatus('error');
    }
  };

  const renderStatusIndicator = (status: 'idle' | 'connecting' | 'connected' | 'error') => {
    switch (status) {
      case 'idle':
        return <Text style={styles.statusIdle}>⚪ Not Started</Text>;
      case 'connecting':
        return (
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color="#FF9500" />
            <Text style={styles.statusConnecting}>Connecting...</Text>
          </View>
        );
      case 'connected':
        return <Text style={styles.statusConnected}>✅ Connected</Text>;
      case 'error':
        return <Text style={styles.statusError}>❌ Error</Text>;
      default:
        return null;
    }
  };

  const renderMintStatus = (status: 'idle' | 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'idle':
        return null;
      case 'pending':
        return (
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color="#FF9500" />
            <Text style={styles.statusConnecting}> Mint in progress...</Text>
          </View>
        );
      case 'success':
        return <Text style={styles.statusConnected}> NFT Minting Successfully</Text>;
      case 'error':
        return <Text style={styles.statusError}>❌ Minting Failed</Text>;
      default:
        return null;
    }
  };

  const renderError = (type: ErrorType) => {
    if (!errors[type]) return null;

    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorMessage}>{errors[type]}</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}> Test NFT Minting App</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Provider Connection</Text>
        {renderStatusIndicator(providerStatus)}

        <TouchableOpacity
          style={styles.button}
          onPress={testProviderConnection}
          disabled={providerStatus === 'connecting' || providerStatus === 'connected'}
        >
          <Text style={styles.buttonText}>Test Provider Connection</Text>
        </TouchableOpacity>
        <Text style={styles.dataTitle}>Latest Block:</Text>
        <Text style={styles.dataText}>{latestBlockNumber}</Text>
        {renderError('provider')}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Create Contract Instance</Text>

        <TouchableOpacity style={styles.button} onPress={creatContract} disabled={contractCreated}>
          <Text style={styles.buttonText}>Create Contract and get Mint Price</Text>
        </TouchableOpacity>

        {contractData && (
          <View style={styles.dataContainer}>
            <Text style={styles.dataTitle}>Contract Data:</Text>
            <Text style={styles.dataText}>Mint Price - {contractData.mintPrice}</Text>
            <Text style={styles.dataText}>Block - {contractData.blockNumber}</Text>
          </View>
        )}
        {renderError('contract')}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wallet Connection</Text>
        {renderStatusIndicator(walletStatus)}

        <TouchableOpacity
          style={styles.button}
          onPress={connectWallet}
          disabled={walletStatus === 'connecting' || walletStatus === 'connected'}
        >
          <Text style={styles.buttonText}>Connect Wallet</Text>
        </TouchableOpacity>

        {walletAddress && (
          <View style={styles.dataContainer}>
            <Text style={styles.dataTitle}>Connected Wallet Address:</Text>
            <Text selectable style={styles.dataText}>
              {walletAddress}
            </Text>
          </View>
        )}
        {renderError('SDK')}
        {renderError('wallet')}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mint NFT</Text>

        <Text style={styles.inputLabel}>Token URI:</Text>
        <TextInput
          style={styles.input}
          value={tokenURI}
          onChangeText={setTokenURI}
          placeholder="Enter token URI (metadata URL)"
          editable={walletStatus === 'connected' && contractCreated}
        />

        <TouchableOpacity style={styles.button} onPress={mintNFT} disabled={!canMint}>
          <Text style={styles.buttonText}>Mint NFT</Text>
        </TouchableOpacity>

        {renderMintStatus(mintStatus)}

        {txHash && (
          <View style={styles.dataContainer}>
            <Text style={styles.dataTitle}>Transaction Hash:</Text>
            <Text selectable>{txHash}</Text>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => Linking.openURL(`https://sepolia.etherscan.io/tx/${txHash}`)}
            >
              <Text style={styles.linkButtonText}>View on Etherscan</Text>
            </TouchableOpacity>
          </View>
        )}
        {renderError('mint')}
      </View>

      <EstimationSection {...estimationProps} />
    </ScrollView>
  );
};

export default EthereumTestScreen2;
