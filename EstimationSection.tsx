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
import { SEPOLIA_TEST_CONTRACT_ADDRESS_TWO } from '@env';
import { globalProvider, NFT_CONTRACT_ABI } from './config';
import { buildMintTransaction } from './transactionUtils';
import { styles } from './styles';
import { useDebounce } from './useDebounce';

interface EstimationProps {
  walletAddress: string | null;
  tokenURI: string;
  contractCreated: boolean;
  onEstimationError: (message: string) => void;
}

const EstimationSection: React.FC<EstimationProps> = ({
  walletAddress,
  tokenURI,
  contractCreated,
  onEstimationError,
}) => {
  const [estimation, setEstimation] = useState<{
    estimatedGas: string | null;
    estimatedGasPrice: string | null;
    mintPrice: string | null;
  }>({ estimatedGas: null, estimatedGasPrice: null, mintPrice: null });

  const debouncedTokenURI = useDebounce(tokenURI, 1000);

  useEffect(() => {
    if (walletAddress && contractCreated && debouncedTokenURI.trim().length > 0) {
      estimateMintTransaction();
    }
  }, [walletAddress, contractCreated, debouncedTokenURI]);

  const estimateMintTransaction = async (): Promise<void> => {
    try {
      if (!walletAddress) {
        throw new Error('Wallet not connected');
      }

      const { tx, mintPrice } = await buildMintTransaction(
        globalProvider,
        walletAddress,
        tokenURI,
        SEPOLIA_TEST_CONTRACT_ADDRESS_TWO,
        NFT_CONTRACT_ABI
      );

      console.log('Using mint price:', ethers.formatEther(mintPrice), 'ETH');

      const gasEstimate = await globalProvider.estimateGas(tx);
      console.log('Estimated gas:', gasEstimate.toString());

      const feeData = await globalProvider.getFeeData();
      if (!feeData.gasPrice) {
        throw new Error('Gas price not available');
      }

      const estimatedGasPriceWei = gasEstimate * feeData.gasPrice;

      const estimatedGasPriceEth = ethers.formatEther(estimatedGasPriceWei);

      setEstimation({
        estimatedGas: gasEstimate.toString(),
        estimatedGasPrice: estimatedGasPriceEth,
        mintPrice: mintPrice,
      });
    } catch (error: any) {
      console.error('Gas estimation error:', error);
      onEstimationError(error.message || 'Estimation failed');
    }
  };

  return (
    <View>
      {estimation.estimatedGas && estimation.estimatedGasPrice && estimation.mintPrice ? (
        <View style={styles.dataContainer}>
          <Text style={styles.dataTitle}>
            Estimated Gas: <Text style={styles.dataText}>{estimation.estimatedGas}</Text>
          </Text>
          <Text style={styles.dataTitle}>
            Estimated Gas Price: <Text style={styles.dataText}>{estimation.estimatedGasPrice}</Text>
          </Text>
          <Text style={styles.dataTitle}>
            Mint Price: <Text style={styles.dataText}>{estimation.mintPrice}</Text>
          </Text>
        </View>
      ) : (
        <Text style={styles.dataText}>Not yet calculated</Text>
      )}
      {/* how would I make a refresh button work here? not to create a new view, but to refresh the above view. state hook?*/}
    </View>
  );
};
