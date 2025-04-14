import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
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
