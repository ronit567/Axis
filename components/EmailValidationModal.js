import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

/**
 * Modal component to display email validation errors
 * Shows when user tries to sign up with non-school email
 */
export default function EmailValidationModal({ visible, onClose, email }) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Invalid Email Domain</Text>
          
          <Text style={styles.modalText}>
            Please use a valid school email address to sign up.
          </Text>
          
          {email && (
            <View style={styles.emailContainer}>
              <Text style={styles.emailLabel}>You entered:</Text>
              <Text style={styles.emailText}>{email}</Text>
            </View>
          )}
          
          <Text style={styles.modalSubtext}>
            Only students with official school email addresses can create an account.
          </Text>
          
          <Text style={styles.exampleText}>
            Example: student@uwo.ca
          </Text>
          
          <TouchableOpacity
            style={styles.button}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>Got it</Text>
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
    color: '#4b307d',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 24,
  },
  emailContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    width: '100%',
  },
  emailLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#333',
  },
  modalSubtext: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 20,
  },
  exampleText: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#4b307d',
    fontStyle: 'italic',
    marginBottom: 20,
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
