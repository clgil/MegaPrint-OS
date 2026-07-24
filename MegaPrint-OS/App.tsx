import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, StatusBar } from 'react-native';
import { OrdersList } from './src/components/OrdersList';
import { NewOrderForm } from './src/components/NewOrderForm';
import { OrderDetailScreen } from './src/screens/OrderDetailScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import FinancialTransactionsScreen from './src/screens/FinancialTransactionsScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import { serviceOrderRepository, clientRepository } from './src/database/repositories';

type Screen = 'LIST' | 'NEW_ORDER' | 'DETAIL' | 'DASHBOARD' | 'SETTINGS' | 'REPORTS' | 'TRANSACTIONS' | 'INVENTORY';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('LIST');
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const ordersData = await serviceOrderRepository.getAll();
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Error', 'No se pudieron cargar las órdenes');
    } finally {
      setLoading(false);
    }
  };

  const handleNewOrderPress = () => {
    setCurrentScreen('NEW_ORDER');
  };

  const handleOrderPress = (order: any) => {
    setSelectedOrderId(order.id);
    setCurrentScreen('DETAIL');
  };

  const handleBackToList = () => {
    setSelectedOrderId(null);
    setCurrentScreen('LIST');
    loadOrders(); // Refresh the list
  };

  const handleDashboardPress = () => {
    setCurrentScreen('DASHBOARD');
  };

  const handleSettingsPress = () => {
    setCurrentScreen('SETTINGS');
  };

  const handleReportsPress = () => {
    setCurrentScreen('REPORTS');
  };

  const handleTransactionsPress = () => {
    setCurrentScreen('TRANSACTIONS');
  };

  const handleInventoryPress = () => {
    setCurrentScreen('INVENTORY');
  };

  const handleCreateOrder = async (orderData: any) => {
    try {
      // First, create or find the client
      // For MVP, we'll create a new client with the provided info
      // In production, you'd search for existing clients first
      
      // This is a simplified version - in real implementation you'd extract
      // client info from the form and create the client first
      const clientId = await clientRepository.create({
        name: 'Cliente Temporal', // Would come from form
        phone: '0000000000', // Would come from form
      });

      // Then create the order
      await serviceOrderRepository.create({
        ...orderData,
        clientId,
      });

      Alert.alert('Éxito', 'Orden creada correctamente', [
        { text: 'OK', onPress: handleBackToList }
      ]);
    } catch (error) {
      console.error('Error creating order:', error);
      Alert.alert('Error', 'No se pudo crear la orden');
    }
  };

  const handleCancelNewOrder = () => {
    setCurrentScreen('LIST');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f6fa" />
      {currentScreen === 'LIST' && (
        <OrdersList
          orders={orders}
          onOrderPress={handleOrderPress}
          onNewOrder={handleNewOrderPress}
          onDashboard={handleDashboardPress}
          onReports={handleReportsPress}
          onTransactions={handleTransactionsPress}
          onInventory={handleInventoryPress}
          onSettings={handleSettingsPress}
        />
      )}
      
      {currentScreen === 'NEW_ORDER' && (
        <NewOrderForm
          onSubmit={handleCreateOrder}
          onCancel={handleCancelNewOrder}
        />
      )}
      
      {currentScreen === 'DETAIL' && selectedOrderId !== null && (
        <OrderDetailScreen
          orderId={selectedOrderId}
          onBack={handleBackToList}
        />
      )}

      {currentScreen === 'DASHBOARD' && (
        <DashboardScreen
          onBack={handleBackToList}
        />
      )}

      {currentScreen === 'SETTINGS' && (
        <SettingsScreen />
      )}

      {currentScreen === 'REPORTS' && (
        <ReportsScreen onBack={handleBackToList} />
      )}

      {currentScreen === 'TRANSACTIONS' && (
        <FinancialTransactionsScreen onBack={handleBackToList} />
      )}

      {currentScreen === 'INVENTORY' && (
        <InventoryScreen onBack={handleBackToList} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
});
