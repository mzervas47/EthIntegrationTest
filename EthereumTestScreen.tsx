import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { ethers } from 'ethers';
import SignClient from '@walletconnect/sign-client';
import { ALCHEMY_API_KEY, SEPOLIA_TEST_CONTRACT_ADDRESS, WALLET_CONNECT_PROJECT_ID } from '@env';

const MINIMAL_ERC721_ABI = [
  'function getChainlinkToken() view returns (address)',
  'function owner() view returns (address)',
  'function withdrawable() view returns (uint256)',
];

const EthereumTestScreen: React.FC = () => {
  const [providerStatus, setProviderStatus] = useState<
    'idle' | 'connecting' | 'connected' | 'error'
  >('idle');
  const [contractData, setContractData] = useState<any>(null);
  const [walletStatus, setWalletStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>(
    'idle'
  );
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [signClient, setSignClient] = useState<SignClient | null>(null);

  const testProviderConnection = async () => {
    try {
      setProviderStatus('connecting');
      setErrorMessage(null);

      console.log('Creating provider..');

      const provider = new ethers.JsonRpcProvider(
        `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
      );

      console.log('Getting latest block..');

      const blockNumber = await provider.getBlockNumber();
      console.log('Latest block number:', blockNumber);

      console.log('Creating contract instance..');

      const contract = new ethers.Contract(
        SEPOLIA_TEST_CONTRACT_ADDRESS,
        MINIMAL_ERC721_ABI,
        provider
      );

      console.log('Calling contract methods..');

      const [getChainlinkToken, owner, withdrawable] = await Promise.all([
        contract.getChainlinkToken(),
        contract.owner(),
        contract.withdrawable(),
      ]);

      setContractData({
        getChainlinkToken: getChainlinkToken.toString(),
        owner: owner.toString(),
        withdrawable: withdrawable.toString(),
        blockNumber,
      });

      setProviderStatus('connected');
    } catch (error: any) {
      console.error('Provider error:', error);
      setProviderStatus('error');
      setErrorMessage(`Provider error: ${error.message || 'Unkown error'}`);
    }
  };

  const initializeWalletConnect = async () => {
    try {
      const client = await SignClient.init({
        projectId: WALLET_CONNECT_PROJECT_ID,
        metadata: {
          name: 'Ethereum Test App',
          description: 'Testing Ethereum integration with React Native',
          // check importance of these metadata properties
          url: 'https://reown.com/',
          // fix this
          icons: ['https://walletconnect.com/walletconnect-logo.png'],
        },
      });

      setSignClient(client);
      return client;
    } catch (error: any) {
      console.error('WalletConnect initialization error:', error);
      setErrorMessage(`WalletConnect initialization error: ${error.message || 'Unknown error'}`);
      return null;
    }
  };

  const connectWallet = async () => {
    try {
      setWalletStatus('connecting');
      setErrorMessage(null);

      const client = signClient || (await initializeWalletConnect());
      if (!client) {
        throw new Error('Failed to initialize WalletConnect');
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
        console.error('No URI avialable for wallet connection');
      }

      const session = await approval();
      console.log('Session established: ', session);

      const accounts = session.namespaces.eip155?.accounts || [];
      if (accounts.length > 0) {
        const address = accounts[0].split(':')[2];
        setWalletAddress(address);
        setWalletStatus('connected');
      } else {
        throw new Error('No accounts found in session');
      }
    } catch (error: any) {
      console.error('Wallet connection error: ', error);
      setWalletStatus('error');
      setErrorMessage(`Wallet connection error: ${error.message || 'Unknown error'}`);
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
            <Text style={styles.statusConnecting}> Connecting...</Text>
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}> Ethereum Integration Test</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Provider Connection</Text>
        {renderStatusIndicator(providerStatus)}

        <TouchableOpacity
          style={styles.button}
          onPress={testProviderConnection}
          disabled={providerStatus === 'connecting'}
        >
          <Text style={styles.buttonText}>Test Provider Connection</Text>
        </TouchableOpacity>

        {contractData && (
          <View style={styles.dataContainer}>
            <Text style={styles.dataTitle}>Contract Data:</Text>
            <Text>Link Token Address: {contractData.getChainlinkToken}</Text>
            <Text>Owner: {contractData.owner}</Text>
            <Text>Available to withdraw: {contractData.withdrawable}</Text>
            <Text>Latest Block: {contractData.blockNumber}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wallet Connection</Text>
        {renderStatusIndicator(walletStatus)}

        <TouchableOpacity
          style={styles.button}
          onPress={connectWallet}
          disabled={walletStatus === 'connecting'}
        >
          <Text style={styles.buttonText}>Connect Wallet</Text>
        </TouchableOpacity>

        {walletAddress && (
          <View style={styles.dataContainer}>
            <Text style={styles.dataTitle}>Wallet Address:</Text>
            <Text selectable>{walletAddress}</Text>
          </View>
        )}
      </View>

      {errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorMessage} selectable>
            {errorMessage}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusIdle: {
    color: '#666',
    marginBottom: 15,
  },
  statusConnecting: {
    color: '#FF9500',
    marginBottom: 15,
  },
  statusConnected: {
    color: 'green',
    marginBottom: 15,
  },
  statusError: {
    color: 'red',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#FF9500',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  dataContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
  },
  dataTitle: {
    fontWeight: '600',
    marginBottom: 5,
  },
  errorContainer: {
    padding: 15,
    backgroundColor: '#FFEEEE',
    borderRadius: 8,
    borderColor: '#FFCCCC',
    borderWidth: 1,
  },
  errorTitle: {
    color: 'red',
    fontWeight: '600',
    marginBottom: 5,
  },
  errorMessage: {
    color: '#CC0000',
  },
});

export default EthereumTestScreen;
