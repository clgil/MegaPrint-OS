import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';

interface NewOrderFormProps {
  onSubmit: (orderData: {
    clientId: number;
    equipmentBrand: string;
    equipmentModel: string;
    equipmentSerialNumber?: string;
    reportedIssue: string;
    aestheticState: {
      scratches: boolean;
      dents: boolean;
      missingParts: boolean;
      screenDamage: boolean;
      otherDamage: boolean;
      notes?: string;
    };
  }) => void;
  onCancel: () => void;
}

export const NewOrderForm: React.FC<NewOrderFormProps> = ({ onSubmit, onCancel }) => {
  // Client selection (simplified - in production would search existing clients or create new)
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  
  // Equipment info
  const [equipmentBrand, setEquipmentBrand] = useState('');
  const [equipmentModel, setEquipmentModel] = useState('');
  const [equipmentSerialNumber, setEquipmentSerialNumber] = useState('');
  
  // Issue description
  const [reportedIssue, setReportedIssue] = useState('');
  
  // Aesthetic state
  const [scratches, setScratches] = useState(false);
  const [dents, setDents] = useState(false);
  const [missingParts, setMissingParts] = useState(false);
  const [screenDamage, setScreenDamage] = useState(false);
  const [otherDamage, setOtherDamage] = useState(false);
  const [aestheticNotes, setAestheticNotes] = useState('');

  const handleSubmit = () => {
    // Validation
    if (!clientName.trim()) {
      Alert.alert('Error', 'El nombre del cliente es requerido');
      return;
    }
    if (!clientPhone.trim()) {
      Alert.alert('Error', 'El teléfono del cliente es requerido');
      return;
    }
    if (!equipmentBrand.trim()) {
      Alert.alert('Error', 'La marca del equipo es requerida');
      return;
    }
    if (!equipmentModel.trim()) {
      Alert.alert('Error', 'El modelo del equipo es requerido');
      return;
    }
    if (!reportedIssue.trim()) {
      Alert.alert('Error', 'La falla reportada es requerida');
      return;
    }

    // In a real app, we would first create/find the client and get their ID
    // For this MVP form, we'll pass a placeholder and handle client creation separately
    Alert.alert(
      'Nota',
      'En la implementación completa, esto crearía el cliente y la orden. Este es un formulario MVP.',
      [{ text: 'OK', onPress: onCancel }]
    );
    
    onSubmit({
      clientId: 1, // Placeholder - would be created in real implementation
      equipmentBrand,
      equipmentModel,
      equipmentSerialNumber: equipmentSerialNumber || undefined,
      reportedIssue,
      aestheticState: {
        scratches,
        dents,
        missingParts,
        screenDamage,
        otherDamage,
        notes: aestheticNotes || undefined,
      },
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Nueva Orden de Servicio</Text>
      
      {/* Client Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Datos del Cliente</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Nombre completo"
          value={clientName}
          onChangeText={setClientName}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Teléfono"
          value={clientPhone}
          onChangeText={setClientPhone}
          keyboardType="phone-pad"
        />
      </View>

      {/* Equipment Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información del Equipo</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Marca (ej. HP, Canon, Epson)"
          value={equipmentBrand}
          onChangeText={setEquipmentBrand}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Modelo"
          value={equipmentModel}
          onChangeText={setEquipmentModel}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Número de Serie (opcional)"
          value={equipmentSerialNumber}
          onChangeText={setEquipmentSerialNumber}
        />
      </View>

      {/* Reported Issue */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Falla Reportada</Text>
        
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describa el problema reportado por el cliente..."
          value={reportedIssue}
          onChangeText={setReportedIssue}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Aesthetic State */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estado Estético del Equipo</Text>
        <Text style={styles.sectionSubtitle}>Marque los daños visibles:</Text>
        
        <View style={styles.checkboxRow}>
          <TouchableOpacity 
            style={[styles.checkbox, scratches && styles.checkboxChecked]}
            onPress={() => setScratches(!scratches)}
          >
            <Text style={styles.checkboxLabel}>Rayones</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.checkbox, dents && styles.checkboxChecked]}
            onPress={() => setDents(!dents)}
          >
            <Text style={styles.checkboxLabel}>Golpes</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.checkboxRow}>
          <TouchableOpacity 
            style={[styles.checkbox, missingParts && styles.checkboxChecked]}
            onPress={() => setMissingParts(!missingParts)}
          >
            <Text style={styles.checkboxLabel}>Piezas Faltantes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.checkbox, screenDamage && styles.checkboxChecked]}
            onPress={() => setScreenDamage(!screenDamage)}
          >
            <Text style={styles.checkboxLabel}>Pantalla Dañada</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={[styles.checkbox, otherDamage && styles.checkboxChecked]}
          onPress={() => setOtherDamage(!otherDamage)}
        >
          <Text style={styles.checkboxLabel}>Otros Daños</Text>
        </TouchableOpacity>
        
        <TextInput
          style={[styles.input, styles.smallTextArea]}
          placeholder="Notas adicionales sobre el estado estético..."
          value={aestheticNotes}
          onChangeText={setAestheticNotes}
          multiline
          numberOfLines={2}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.cancelButton]} 
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.submitButton]} 
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>Crear Orden</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#fafafa',
    marginBottom: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  smallTextArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  checkboxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: '48%',
    backgroundColor: '#fafafa',
  },
  checkboxChecked: {
    backgroundColor: '#ebf5fb',
    borderColor: '#3498db',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#34495e',
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
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
  submitButton: {
    backgroundColor: '#27ae60',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default NewOrderForm;
