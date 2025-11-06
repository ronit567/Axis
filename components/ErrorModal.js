import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

/**
 * Error modal component for displaying authentication errors
 */
export default function ErrorModal({ visible, onClose, title, message }) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>{title || 'Error'}</Text>
          
          <Text style={styles.modalText}>
            {message || 'An error occurred. Please try again.'}
          </Text>
          
          <TouchableOpacity
            style={styles.button}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'HammersmithOne_400Regular',
    color: '#d32f2f',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#4b307d',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 40,
    elevation: 2,
  },
  buttonText: {
    color: 'white',
    fontFamily: 'Poppins_500Medium',
    fontSize: 16,
    textAlign: 'center',
  },
});
