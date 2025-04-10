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
  'function mintNFT(string memory tokenURI_) public payable',
  'function tokenURI(uint256 tokenId) public view returns (string memory)',
  'function MINT_PRICE() public view returns (uint256)',
  'function withdraw(address payable recipient) public',
  'function ownerOf(uint256 tokenId) public view returns (address)',
];

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [signClient, setSignClient] = useState<SignClient | null>(null);
  const [tokenURI, setTokenURI] = useState<string>('https://example.com/metadata.json');
  const [mintStatus, setMintStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [contractCreated, setContractCreated] = useState<boolean>(false);
  const canMint = walletStatus === 'connected' && contractCreated && tokenURI.trim().length > 0 && mintStatus !== 'pending';
  

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
      setProviderStatus('connected');
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
          icons: [''],
        },
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
      console.error('Wallet connection error');
      setWalletStatus('error');
      setErrorMessage(`Wallet connection error: ${error.message || 'Unknown error'}`);
    }
  };

  const creatContract = async () => {
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
      return null;
    }
  };

  const mintNFT = async () => {
    try {
      if (!signClient || !session || !walletAddress) {
        throw new Error('Wallet not connected');
      }

      setMintStatus('pending');
      setErrorMessage(null);

      const contract = new ethers.Interface(NFT_CONTRACT_ABI);

      const data = contractData.encodeFunctionData('mint', [tokenURI]);

      const value = ethers.parseEther('0.001');

      const tx = {
        from: walletAddress,
        to: SEPOLIA_TEST_CONTRACT_ADDRESS_TWO,
        data: data,
        value: value.toString(),
      };

      const chainId = session.namespaces.eip155.chains[0].split(':')[1];

      const result = (await signClient.request({
        topic: session.topic,
        chainId: `eip155:${chainId}`,
        request: {
          method: 'eth_sendTransaction',
          params: [tx],
        },
      })) as string;

      console.log('Transaction hash:', result);

      setTxHash(result);
      setMintStatus('success');
    } catch (error: any) {
      console.error('Minting error:', error);
      setMintStatus('error');
      setErrorMessage(`Minting error: ${error.message || 'Unknown erro'}`);
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
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Create Contract Instance</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={creatContract}
          disabled={contractCreated}
        >
          <Text style={styles.buttonText}>Create Contract and get Mint Price</Text>
        </TouchableOpacity>

        {contractData && (
          <View style={styles.dataContainer}>
            <Text style={styles.dataTitle}>Contract Data:</Text>
            <Text style={styles.dataText}>Mint Price - {contractData.mintPrice}</Text>
            <Text style={styles.dataText}>Block - {contractData.blockNumber}</Text>
          </View>
        )}
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

        <TouchableOpacity
        style={styles.button}
        onPress={mintNFT}
        disabled={canMint}
        >
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
        </View>
    </ScrollView>
  )
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
    marginVertical: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
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
  dataText: {
    fontWeight: '400',
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
  linkButton: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#e8e8e8',
    borderRadius: 4,
    alignItems: 'center',
  },
  linkButtonText: {
    color: '#0066CC',
    fontWeight: '500',
  },
});

export default EthereumTestScreen2;
