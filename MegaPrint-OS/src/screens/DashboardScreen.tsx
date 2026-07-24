import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { financialRepository, expenseRepository, incomeRepository, warrantyClaimRepository, inventoryRepository } from '../database/repositories';
import type { MonthlyFinancialSummary, WarrantyClaim } from '../types';

interface DashboardScreenProps {
  onBack: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onBack }) => {
  const [currentMonthSummary, setCurrentMonthSummary] = useState<MonthlyFinancialSummary | null>(null);
  const [previousMonthSummary, setPreviousMonthSummary] = useState<MonthlyFinancialSummary | null>(null);
  const [growthPercentage, setGrowthPercentage] = useState<number>(0);
  const [pendingWarranties, setPendingWarranties] = useState<WarrantyClaim[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      // Calculate previous month
      let previousYear = currentYear;
      let previousMonth = currentMonth - 1;
      if (previousMonth === 0) {
        previousMonth = 12;
        previousYear = currentYear - 1;
      }

      // Get financial comparison
      const { current, previous, growthPercentage: growth } = await financialRepository.compareMonths(
        currentYear, currentMonth, previousYear, previousMonth
      );
      
      setCurrentMonthSummary(current);
      setPreviousMonthSummary(previous);
      setGrowthPercentage(growth);

      // Get pending warranty claims
      const pending = await warrantyClaimRepository.getPendingClaims();
      setPendingWarranties(pending);

      // Get low stock items
      const lowStock = await inventoryRepository.getLowStock();
      setLowStockItems(lowStock);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      Alert.alert('Error', 'No se pudo cargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  const getGrowthColor = (): string => {
    if (growthPercentage > 0) return '#27ae60';
    if (growthPercentage < 0) return '#e74c3c';
    return '#95a5a6';
  };

  const getGrowthIcon = (): string => {
    if (growthPercentage > 0) return '📈';
    if (growthPercentage < 0) return '📉';
    return '➡️';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Cargando dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dashboard Financiero</Text>
      </View>

      {/* Current Month Summary Card */}
      {currentMonthSummary && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumen del Mes Actual</Text>
          
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Ingresos Totales</Text>
              <Text style={[styles.summaryValue, styles.incomeValue]}>
                {formatCurrency(currentMonthSummary.totalIncome)}
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Gastos Totales</Text>
              <Text style={[styles.summaryValue, styles.expenseValue]}>
                {formatCurrency(currentMonthSummary.totalExpenses)}
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Ganancia Neta</Text>
              <Text style={[
                styles.summaryValue, 
                currentMonthSummary.netProfit >= 0 ? styles.profitValue : styles.lossValue
              ]}>
                {formatCurrency(currentMonthSummary.netProfit)}
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Margen de Ganancia</Text>
              <Text style={styles.summaryValue}>
                {currentMonthSummary.profitMargin.toFixed(1)}%
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{currentMonthSummary.serviceCount}</Text>
              <Text style={styles.statLabel}>Servicios Completados</Text>
            </View>
            
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{formatCurrency(currentMonthSummary.averageTicket)}</Text>
              <Text style={styles.statLabel}>Ticket Promedio</Text>
            </View>
          </View>
        </View>
      )}

      {/* Growth Comparison Card */}
      {previousMonthSummary && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Comparación Mensual</Text>
          
          <View style={styles.comparisonRow}>
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>Mes Anterior</Text>
              <Text style={styles.comparisonValue}>{formatCurrency(previousMonthSummary.netProfit)}</Text>
            </View>
            
            <View style={[styles.growthIndicator, { backgroundColor: getGrowthColor() + '20' }]}>
              <Text style={styles.growthEmoji}>{getGrowthIcon()}</Text>
              <Text style={[styles.growthText, { color: getGrowthColor() }]}>
                {growthPercentage >= 0 ? '+' : ''}{growthPercentage.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Alerts Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Alertas</Text>
        
        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>⚠️ Stock Bajo ({lowStockItems.length} productos)</Text>
            {lowStockItems.slice(0, 3).map(item => (
              <Text key={item.id} style={styles.alertText}>
                • {item.name}: {item.stock_quantity} unidades
              </Text>
            ))}
            {lowStockItems.length > 3 && (
              <Text style={styles.alertMore}>+ {lowStockItems.length - 3} más</Text>
            )}
          </View>
        )}
        
        {/* Pending Warranties Alert */}
        {pendingWarranties.length > 0 && (
          <View style={[styles.alertBox, styles.warningAlert]}>
            <Text style={styles.alertTitle}>🔧 Garantías Pendientes ({pendingWarranties.length})</Text>
            {pendingWarranties.slice(0, 3).map(claim => (
              <Text key={claim.id} style={styles.alertText}>
                • Orden #{claim.order_id}: {claim.description.substring(0, 30)}...
              </Text>
            ))}
          </View>
        )}
        
        {lowStockItems.length === 0 && pendingWarranties.length === 0 && (
          <Text style={styles.noAlerts}>✅ Sin alertas pendientes</Text>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Accesos Rápidos</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={() => Alert.alert('Próximamente', 'Registro de gastos')}>
            <Text style={styles.quickActionEmoji}>💰</Text>
            <Text style={styles.quickActionText}>Registrar Gasto</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction} onPress={() => Alert.alert('Próximamente', 'Registro de ingreso')}>
            <Text style={styles.quickActionEmoji}>💵</Text>
            <Text style={styles.quickActionText}>Registrar Ingreso</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction} onPress={() => Alert.alert('Próximamente', 'Nueva garantía')}>
            <Text style={styles.quickActionEmoji}>🔧</Text>
            <Text style={styles.quickActionText}>Nueva Garantía</Text>
          </TouchableOpacity>
        </View>
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
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
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
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  incomeValue: {
    color: '#3498db',
  },
  expenseValue: {
    color: '#e74c3c',
  },
  profitValue: {
    color: '#27ae60',
  },
  lossValue: {
    color: '#e74c3c',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#ecf0f1',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  comparisonItem: {
    flex: 1,
  },
  comparisonLabel: {
    fontSize: 12,
    color: '#666',
  },
  comparisonValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  growthIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 8,
  },
  growthEmoji: {
    fontSize: 20,
  },
  growthText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  alertBox: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    padding: 12,
    borderRadius: 4,
    marginBottom: 12,
  },
  warningAlert: {
    backgroundColor: '#ffe5e5',
    borderLeftColor: '#e74c3c',
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  alertText: {
    fontSize: 13,
    color: '#856404',
    marginBottom: 4,
  },
  alertMore: {
    fontSize: 12,
    color: '#856404',
    fontStyle: 'italic',
  },
  noAlerts: {
    fontSize: 14,
    color: '#27ae60',
    textAlign: 'center',
    padding: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  quickActionEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
});

export default DashboardScreen;
