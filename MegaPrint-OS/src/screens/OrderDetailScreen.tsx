import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { serviceOrderRepository, clientRepository, workshopConfigRepository } from '../database/repositories';
import { pdfService } from '../utils/pdfGenerator';
import { OrderStatusBadge } from '../components/OrderStatusBadge';

interface OrderDetailScreenProps {
  orderId: number;
  onBack: () => void;
}

export const OrderDetailScreen: React.FC<OrderDetailScreenProps> = ({ orderId, onBack }) => {
  const [order, setOrder] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [workshopConfig, setWorkshopConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      const orderData = await serviceOrderRepository.getById(orderId);
      if (orderData) {
        setOrder(orderData);
        const clientData = await clientRepository.getById(orderData.clientId);
        setClient(clientData);
        
        const config = await workshopConfigRepository.getConfig();
        setWorkshopConfig(config || {
          workshopName: 'Taller de Hardware',
          warrantyTerms: 'Garantía de 30 días por defectos de fabricación o instalación.',
        });
      }
    } catch (error) {
      console.error('Error loading order details:', error);
      Alert.alert('Error', 'No se pudo cargar el detalle de la orden');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReceptionPDF = async () => {
    if (!order || !client) return;

    try {
      const pdfUri = await pdfService.generateReceptionPDF(
        {
          orderNumber: order.orderNumber,
          clientName: client.name,
          clientPhone: client.phone,
          equipmentBrand: order.equipmentBrand,
          equipmentModel: order.equipmentModel,
          serialNumber: order.equipmentSerialNumber,
          reportedIssue: order.reportedIssue,
          aestheticState: order.aestheticState,
          receivedAt: order.receivedAt,
          customerSignature: order.customerSignature,
        },
        workshopConfig || {}
      );

      await pdfService.sharePDF(pdfUri, `Recepcion_${order.orderNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'No se pudo generar el PDF');
    }
  };

  const handleGenerateDeliveryPDF = async () => {
    if (!order || !client) return;

    try {
      const pdfUri = await pdfService.generateDeliveryPDF(
        {
          orderNumber: order.orderNumber,
          clientName: client.name,
          clientPhone: client.phone,
          equipmentBrand: order.equipmentBrand,
          equipmentModel: order.equipmentModel,
          serialNumber: order.equipmentSerialNumber,
          reportedIssue: order.reportedIssue,
          aestheticState: order.aestheticState,
          diagnosis: order.diagnosis,
          solutionApplied: order.solutionApplied,
          laborCost: order.laborCost,
          partsCost: order.partsCost,
          totalPrice: order.totalPrice,
          receivedAt: order.receivedAt,
          customerSignature: order.customerSignature,
        },
        workshopConfig || {}
      );

      await pdfService.sharePDF(pdfUri, `Entrega_${order.orderNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'No se pudo generar el PDF');
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      await serviceOrderRepository.updateStatus(orderId, newStatus);
      await loadOrderDetails();
      Alert.alert('Éxito', `Estado actualizado a ${newStatus}`);
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <Text>Orden no encontrada</Text>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <OrderStatusBadge status={order.status} />
      </View>

      {/* Order Number */}
      <View style={styles.section}>
        <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        <Text style={styles.dateText}>{formatDate(order.receivedAt)}</Text>
      </View>

      {/* Client Info */}
      {client && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <Text style={styles.infoText}>{client.name}</Text>
          <Text style={styles.infoText}>{client.phone}</Text>
          {client.email && <Text style={styles.infoText}>{client.email}</Text>}
        </View>
      )}

      {/* Equipment Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Equipo</Text>
        <Text style={styles.infoText}><strong>Marca:</strong> {order.equipmentBrand}</Text>
        <Text style={styles.infoText}><strong>Modelo:</strong> {order.equipmentModel}</Text>
        {order.equipmentSerialNumber && (
          <Text style={styles.infoText}><strong>S/N:</strong> {order.equipmentSerialNumber}</Text>
        )}
      </View>

      {/* Reported Issue */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Falla Reportada</Text>
        <Text style={styles.infoText}>{order.reportedIssue}</Text>
      </View>

      {/* Aesthetic State */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estado Estético</Text>
        <View style={styles.aestheticGrid}>
          <Text>{order.aestheticState.scratches ? '☑ Rayones' : '☐ Rayones'}</Text>
          <Text>{order.aestheticState.dents ? '☑ Golpes' : '☐ Golpes'}</Text>
          <Text>{order.aestheticState.missingParts ? '☑ Piezas Faltantes' : '☐ Piezas Faltantes'}</Text>
          <Text>{order.aestheticState.screenDamage ? '☑ Pantalla Dañada' : '☐ Pantalla Dañada'}</Text>
          <Text>{order.aestheticState.otherDamage ? '☑ Otros' : '☐ Otros'}</Text>
        </View>
        {order.aestheticState.notes && (
          <Text style={styles.noteText}>{order.aestheticState.notes}</Text>
        )}
      </View>

      {/* Technical Details (if available) */}
      {order.diagnosis && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diagnóstico</Text>
          <Text style={styles.infoText}>{order.diagnosis}</Text>
        </View>
      )}

      {order.solutionApplied && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Solución Aplicada</Text>
          <Text style={styles.infoText}>{order.solutionApplied}</Text>
        </View>
      )}

      {/* Costs */}
      {(order.laborCost || order.partsCost || order.totalPrice) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Costos</Text>
          {order.laborCost > 0 && (
            <Text style={styles.infoText}>Mano de obra: ${(order.laborCost || 0).toFixed(2)}</Text>
          )}
          {order.partsCost > 0 && (
            <Text style={styles.infoText}>Repuestos: ${(order.partsCost || 0).toFixed(2)}</Text>
          )}
          {order.totalPrice > 0 && (
            <Text style={[styles.infoText, styles.totalText]}>
              Total: ${(order.totalPrice || 0).toFixed(2)}
            </Text>
          )}
        </View>
      )}

      {/* Status Update Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actualizar Estado</Text>
        <View style={styles.statusButtons}>
          {order.status !== 'RECIBIDO' && (
            <TouchableOpacity 
              style={styles.statusButton}
              onPress={() => handleUpdateStatus('RECIBIDO')}
            >
              <Text style={styles.statusButtonText}>Recibido</Text>
            </TouchableOpacity>
          )}
          {order.status !== 'EN_DIAGNOSTICO' && (
            <TouchableOpacity 
              style={styles.statusButton}
              onPress={() => handleUpdateStatus('EN_DIAGNOSTICO')}
            >
              <Text style={styles.statusButtonText}>En Diagnóstico</Text>
            </TouchableOpacity>
          )}
          {order.status !== 'REPARADO' && (
            <TouchableOpacity 
              style={styles.statusButton}
              onPress={() => handleUpdateStatus('REPARADO')}
            >
              <Text style={styles.statusButtonText}>Reparado</Text>
            </TouchableOpacity>
          )}
          {order.status !== 'ENTREGADO' && (
            <TouchableOpacity 
              style={[styles.statusButton, styles.deliveredButton]}
              onPress={() => handleUpdateStatus('ENTREGADO')}
            >
              <Text style={styles.statusButtonText}>Entregado</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* PDF Generation Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Documentos</Text>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleGenerateReceptionPDF}
        >
          <Text style={styles.actionButtonText}>📄 Generar Comprobante de Recepción</Text>
        </TouchableOpacity>
        
        {(order.status === 'REPARADO' || order.status === 'ENTREGADO') && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.deliveryButton]}
            onPress={handleGenerateDeliveryPDF}
          >
            <Text style={styles.actionButtonText}>📦 Generar Orden de Entrega</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    color: '#3498db',
    fontSize: 16,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
  },
  orderNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  dateText: {
    fontSize: 14,
    color: '#95a5a6',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 6,
    lineHeight: 20,
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27ae60',
    marginTop: 8,
  },
  aestheticGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  noteText: {
    fontSize: 13,
    color: '#7f8c8d',
    fontStyle: 'italic',
    marginTop: 8,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  deliveredButton: {
    backgroundColor: '#27ae60',
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  actionButton: {
    backgroundColor: '#3498db',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  deliveryButton: {
    backgroundColor: '#27ae60',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default OrderDetailScreen;
