import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, ScrollView } from 'react-native';
import { OrderStatusBadge } from '../components/OrderStatusBadge';

interface ServiceOrder {
  id: number;
  orderNumber: string;
  clientName: string;
  equipmentBrand: string;
  equipmentModel: string;
  status: string;
  receivedAt: string;
}

interface OrdersListProps {
  orders: ServiceOrder[];
  onOrderPress: (order: ServiceOrder) => void;
  onNewOrder?: () => void;
  onDashboard?: () => void;
  onSettings?: () => void;
  onReports?: () => void;
}

export const OrdersList: React.FC<OrdersListProps> = ({ 
  orders, 
  onOrderPress,
  onNewOrder,
  onDashboard,
  onSettings,
  onReports 
}) => {
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const filteredOrders = filterStatus 
    ? orders.filter(o => o.status === filterStatus)
    : orders;

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderOrderCard = ({ item }: { item: ServiceOrder }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => onOrderPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.orderNumber}>{item.orderNumber}</Text>
        <OrderStatusBadge status={item.status} />
      </View>
      
      <Text style={styles.clientName}>{item.clientName}</Text>
      
      <View style={styles.equipmentInfo}>
        <Text style={styles.equipmentText}>
          {item.equipmentBrand} {item.equipmentModel}
        </Text>
      </View>
      
      <View style={styles.cardFooter}>
        <Text style={styles.dateLabel}>Recibido:</Text>
        <Text style={styles.dateValue}>{formatDate(item.receivedAt)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Órdenes de Servicio</Text>
        
        <View style={styles.headerActions}>
          {onReports && (
            <TouchableOpacity style={styles.reportsButton} onPress={onReports}>
              <Text style={styles.reportsButtonText}>📊 Reportes</Text>
            </TouchableOpacity>
          )}
          {onDashboard && (
            <TouchableOpacity style={styles.dashboardButton} onPress={onDashboard}>
              <Text style={styles.dashboardButtonText}>📈 Dashboard</Text>
            </TouchableOpacity>
          )}
          
          {onSettings && (
            <TouchableOpacity style={styles.settingsButton} onPress={onSettings}>
              <Text style={styles.settingsButtonText}>⚙️</Text>
            </TouchableOpacity>
          )}
          {onNewOrder && (
            <TouchableOpacity style={styles.newOrderButton} onPress={onNewOrder}>
              <Text style={styles.newOrderButtonText}>+ Nueva</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Quick filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterChip, !filterStatus && styles.filterChipActive]}
          onPress={() => setFilterStatus(null)}
        >
          <Text style={[styles.filterChipText, !filterStatus && styles.filterChipTextActive]}>
            Todas
          </Text>
        </TouchableOpacity>
        
        {['RECIBIDO', 'EN_DIAGNOSTICO', 'REPARADO', 'ENTREGADO'].map(status => (
          <TouchableOpacity
            key={status}
            style={[styles.filterChip, filterStatus === status && styles.filterChipActive]}
            onPress={() => setFilterStatus(status)}
          >
            <Text style={[styles.filterChipText, filterStatus === status && styles.filterChipTextActive]}>
              {status.replace(/_/g, ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filteredOrders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No hay órdenes</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  reportsButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reportsButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  dashboardButton: {
    backgroundColor: '#9b59b6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dashboardButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  newOrderButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newOrderButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  settingsButton: {
    backgroundColor: '#95a5a6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  settingsButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f2f6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#3498db',
  },
  filterChipText: {
    color: '#666',
    fontSize: 13,
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  clientName: {
    fontSize: 16,
    color: '#34495e',
    marginBottom: 8,
  },
  equipmentInfo: {
    marginBottom: 8,
  },
  equipmentText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f2f6',
  },
  dateLabel: {
    fontSize: 12,
    color: '#95a5a6',
    marginRight: 4,
  },
  dateValue: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#95a5a6',
  },
});

export default OrdersList;
