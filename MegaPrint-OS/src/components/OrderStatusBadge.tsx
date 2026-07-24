import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

interface OrderStatusBadgeProps {
  status: string;
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'RECIBIDO':
        return { color: '#3498db', backgroundColor: '#ebf5fb' };
      case 'EN_DIAGNOSTICO':
        return { color: '#f39c12', backgroundColor: '#fef5e7' };
      case 'ESPERANDO_PIEZA':
        return { color: '#e67e22', backgroundColor: '#fdedec' };
      case 'REPARADO':
        return { color: '#27ae60', backgroundColor: '#e9f7ef' };
      case 'ENTREGADO':
        return { color: '#1abc9c', backgroundColor: '#e8f8f5' };
      case 'SIN_SOLUCION':
        return { color: '#7f8c8d', backgroundColor: '#f4f6f7' };
      default:
        return { color: '#95a5a6', backgroundColor: '#f4f6f7' };
    }
  };

  const config = getStatusConfig(status);
  
  const formatStatus = (status: string): string => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <View style={[styles.badge, { backgroundColor: config.backgroundColor }]}>
      <Text style={[styles.statusText, { color: config.color }]}>
        {formatStatus(status)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});

export default OrderStatusBadge;
