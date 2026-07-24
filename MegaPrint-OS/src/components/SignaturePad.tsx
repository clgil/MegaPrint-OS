import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';

interface SignaturePadProps {
  onSave: (signatureBase64: string) => void;
  onCancel: () => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onCancel }) => {
  // Note: In a real implementation, you would use react-native-signature-canvas
  // This is a placeholder component for the MVP
  
  const [isSigned, setIsSigned] = useState(false);

  const handleSave = () => {
    // Simulate signature capture - in production this would get actual canvas data
    const mockSignature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    onSave(mockSignature);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Firma del Cliente</Text>
      <Text style={styles.instructions}>
        Por favor, firme en el área de abajo usando su dedo o un stylus.
      </Text>
      
      <View style={styles.signatureArea}>
        <Text style={styles.placeholderText}>
          Área de firma (Canvas)
        </Text>
        <Text style={styles.hintText}>
          [En la implementación real, aquí iría el componente SignatureCanvas]
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.cancelButton]} 
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.saveButton, !isSigned && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={!isSigned}
        >
          <Text style={styles.saveButtonText}>Guardar Firma</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  instructions: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  signatureArea: {
    height: 250,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  placeholderText: {
    fontSize: 18,
    color: '#999',
  },
  hintText: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#27ae60',
  },
  saveButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SignaturePad;
