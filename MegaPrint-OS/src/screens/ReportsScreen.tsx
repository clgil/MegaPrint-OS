import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { reportsRepository, activityLogRepository } from '../database/repositories';
import { exportToCSV, shareFile, formatDate, formatCurrency, getDateRange, getPeriodLabel } from '../utils/reports';
import type { FinancialReport, InventoryReport, ActivityReport, ReportPeriod } from '../types';

interface ReportsScreenProps {
  currencySymbol?: string;
  onBack?: () => void;
}

export default function ReportsScreen({ currencySymbol = '$', onBack }: ReportsScreenProps) {
  const [selectedTab, setSelectedTab] = useState<'financial' | 'inventory' | 'activity'>('financial');
  const [period, setPeriod] = useState<ReportPeriod>('MONTH');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [financialReport, setFinancialReport] = useState<FinancialReport | null>(null);
  const [inventoryReport, setInventoryReport] = useState<InventoryReport | null>(null);
  const [activityReport, setActivityReport] = useState<ActivityReport | null>(null);

  const loadReports = async () => {
    setLoading(true);
    try {
      if (selectedTab === 'financial') {
        const now = new Date();
        const report = await reportsRepository.generateFinancialReport(now.getMonth() + 1, now.getFullYear());
        setFinancialReport(report);
        
        // Cache the report
        const { start, end } = getDateRange(period);
        await reportsRepository.cacheReport('financial', start, end, report);
      } else if (selectedTab === 'inventory') {
        const report = await reportsRepository.generateInventoryReport();
        setInventoryReport(report);
      } else if (selectedTab === 'activity') {
        const { start, end } = getDateRange(period);
        const report = await reportsRepository.generateActivityReport(start, end);
        setActivityReport(report);
        
        // Cache the report
        await reportsRepository.cacheReport('activity', start, end, report);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      Alert.alert('Error', 'No se pudieron cargar los reportes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [selectedTab, period]);

  const handleExportCSV = async () => {
    try {
      let filename = '';
      let columns: string[] = [];
      let data: any[] = [];

      if (selectedTab === 'financial' && financialReport) {
        filename = `reporte_financiero_${financialReport.year}_${String(financialReport.month).padStart(2, '0')}.csv`;
        columns = ['Fecha', 'Ingresos', 'Gastos', 'Ganancia Neta', 'Transacciones'];
        data = financialReport.dailyBreakdown.map(day => ({
          Fecha: day.date,
          Ingresos: day.income,
          Gastos: day.expenses,
          'Ganancia Neta': day.netProfit,
          Transacciones: day.transactionCount,
        }));
      } else if (selectedTab === 'inventory' && inventoryReport) {
        filename = 'inventario_completo.csv';
        columns = ['Nombre', 'Categoría', 'Stock', 'Costo', 'Valor Total', 'Estado'];
        data = inventoryReport.items.map(item => ({
          Nombre: item.name,
          Categoría: item.category,
          Stock: item.stockQuantity,
          Costo: item.costPrice,
          'Valor Total': item.costPrice * item.stockQuantity,
          Estado: item.stockQuantity === 0 ? 'Agotado' : item.stockQuantity <= item.minStockLevel ? 'Bajo' : 'OK',
        }));
      } else if (selectedTab === 'activity' && activityReport) {
        filename = `actividad_${activityReport.startDate}_a_${activityReport.endDate}.csv`;
        columns = ['Métrica', 'Valor'];
        data = [
          { Métrica: 'Total Órdenes', Valor: activityReport.totalOrders },
          { Métrica: 'Órdenes Completadas', Valor: activityReport.completedOrders },
          { Métrica: 'Tiempo Promedio Reparación (días)', Valor: activityReport.avgRepairTime },
        ];
      }

      if (data.length === 0) {
        Alert.alert('Sin datos', 'No hay datos para exportar');
        return;
      }

      const filePath = await exportToCSV(data, filename, columns);
      await shareFile(filePath, 'Exportar Reporte');
      
      // Log the export action
      await activityLogRepository.log('EXPORT_REPORT', undefined, undefined, null, { 
        reportType: selectedTab, 
        filename 
      });
      
      Alert.alert('Éxito', `Reporte exportado: ${filename}`);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      Alert.alert('Error', 'No se pudo exportar el reporte');
    }
  };

  const renderFinancialReport = () => {
    if (!financialReport) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resumen del Mes</Text>
        
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, styles.incomeCard]}>
            <Text style={styles.summaryLabel}>Ingresos</Text>
            <Text style={styles.summaryValue}>{formatCurrency(financialReport.totalIncome, currencySymbol)}</Text>
          </View>
          
          <View style={[styles.summaryCard, styles.expenseCard]}>
            <Text style={styles.summaryLabel}>Gastos</Text>
            <Text style={styles.summaryValue}>{formatCurrency(financialReport.totalExpenses, currencySymbol)}</Text>
          </View>
          
          <View style={[styles.summaryCard, styles.profitCard]}>
            <Text style={styles.summaryLabel}>Ganancia Neta</Text>
            <Text style={styles.summaryValue}>{formatCurrency(financialReport.netProfit, currencySymbol)}</Text>
          </View>
          
          <View style={[styles.summaryCard, styles.marginCard]}>
            <Text style={styles.summaryLabel}>Margen</Text>
            <Text style={styles.summaryValue}>{financialReport.profitMargin}%</Text>
          </View>
        </View>

        <Text style={styles.subsectionTitle}>Desglose Diario</Text>
        {financialReport.dailyBreakdown.slice(0, 15).map((day, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.rowLabel}>{formatDate(day.date)}</Text>
            <View style={styles.rowValues}>
              <Text style={styles.rowValueIncome}>{formatCurrency(day.income, currencySymbol)}</Text>
              <Text style={styles.rowValueExpense}>{formatCurrency(day.expenses, currencySymbol)}</Text>
              <Text style={[styles.rowValueNet, day.netProfit >= 0 ? styles.positive : styles.negative]}>
                {formatCurrency(day.netProfit, currencySymbol)}
              </Text>
            </View>
          </View>
        ))}
        
        {financialReport.dailyBreakdown.length > 15 && (
          <Text style={styles.moreInfo}>+{financialReport.dailyBreakdown.length - 15} días más...</Text>
        )}
      </View>
    );
  };

  const renderInventoryReport = () => {
    if (!inventoryReport) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resumen de Inventario</Text>
        
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Items</Text>
            <Text style={styles.summaryValue}>{inventoryReport.totalItems}</Text>
          </View>
          
          <View style={[styles.summaryCard, styles.warningCard]}>
            <Text style={styles.summaryLabel}>Stock Bajo</Text>
            <Text style={styles.summaryValue}>{inventoryReport.lowStockItems}</Text>
          </View>
          
          <View style={[styles.summaryCard, styles.dangerCard]}>
            <Text style={styles.summaryLabel}>Agotados</Text>
            <Text style={styles.summaryValue}>{inventoryReport.outOfStockItems}</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Valor Total</Text>
            <Text style={styles.summaryValue}>{formatCurrency(inventoryReport.totalValue, currencySymbol)}</Text>
          </View>
        </View>

        <Text style={styles.subsectionTitle}>Por Categoría</Text>
        {inventoryReport.categories.map((cat, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.rowLabel}>{cat.category}</Text>
            <View style={styles.rowValues}>
              <Text style={styles.rowValue}>{cat.count} items</Text>
              <Text style={styles.rowValueSecondary}>{formatCurrency(cat.value, currencySymbol)}</Text>
            </View>
          </View>
        ))}

        <Text style={styles.subsectionTitle}>Items con Stock Bajo</Text>
        {inventoryReport.items
          .filter(item => item.stockQuantity <= item.minStockLevel)
          .slice(0, 10)
          .map((item, index) => (
            <View key={index} style={styles.row}>
              <Text style={styles.rowLabel}>{item.name}</Text>
              <Text style={[styles.rowValue, item.stockQuantity === 0 ? styles.dangerText : styles.warningText]}>
                {item.stockQuantity} / {item.minStockLevel} mín
              </Text>
            </View>
          ))}
      </View>
    );
  };

  const renderActivityReport = () => {
    if (!activityReport) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actividad del Taller</Text>
        <Text style={styles.periodInfo}>
          {formatDate(activityReport.startDate)} - {formatDate(activityReport.endDate)}
        </Text>
        
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Órdenes</Text>
            <Text style={styles.summaryValue}>{activityReport.totalOrders}</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Completadas</Text>
            <Text style={styles.summaryValue}>{activityReport.completedOrders}</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Tiempo Prom.</Text>
            <Text style={styles.summaryValue}>{activityReport.avgRepairTime} días</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Tasa Completion</Text>
            <Text style={styles.summaryValue}>
              {activityReport.totalOrders > 0 
                ? Math.round((activityReport.completedOrders / activityReport.totalOrders) * 100) 
                : 0}%
            </Text>
          </View>
        </View>

        <Text style={styles.subsectionTitle}>Órdenes por Estado</Text>
        {Object.entries(activityReport.ordersByStatus).map(([status, count], index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.rowLabel}>{status}</Text>
            <Text style={styles.rowValue}>{count}</Text>
          </View>
        ))}

        <Text style={styles.subsectionTitle}>Marcas Más Frecuentes</Text>
        {Object.entries(activityReport.ordersByBrand).map(([brand, count], index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.rowLabel}>{brand}</Text>
            <Text style={styles.rowValue}>{count}</Text>
          </View>
        ))}

        <Text style={styles.subsectionTitle}>Fallas Más Comunes</Text>
        {activityReport.topIssues.map((issue, index) => (
          <View key={index} style={styles.row}>
            <Text style={[styles.rowLabel, styles.truncate]}>{issue.issue}</Text>
            <Text style={styles.rowValue}>{issue.count}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.title}>📊 Reportes</Text>
        </View>
        <TouchableOpacity style={styles.exportButton} onPress={handleExportCSV}>
          <Text style={styles.exportButtonText}>📤 Exportar</Text>
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {(['DAY', 'WEEK', 'MONTH', 'QUARTER', 'YEAR'] as ReportPeriod[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodButton, period === p && styles.periodButtonActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodButtonText, period === p && styles.periodButtonTextActive]}>
              {getPeriodLabel(p)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'financial' && styles.tabActive]}
          onPress={() => setSelectedTab('financial')}
        >
          <Text style={[styles.tabText, selectedTab === 'financial' && styles.tabTextActive]}>
            💰 Finanzas
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'inventory' && styles.tabActive]}
          onPress={() => setSelectedTab('inventory')}
        >
          <Text style={[styles.tabText, selectedTab === 'inventory' && styles.tabTextActive]}>
            📦 Inventario
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'activity' && styles.tabActive]}
          onPress={() => setSelectedTab('activity')}
        >
          <Text style={[styles.tabText, selectedTab === 'activity' && styles.tabTextActive]}>
            📈 Actividad
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadReports} />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color="#4A90E2" style={styles.loader} />
        ) : (
          <>
            {selectedTab === 'financial' && renderFinancialReport()}
            {selectedTab === 'inventory' && renderInventoryReport()}
            {selectedTab === 'activity' && renderActivityReport()}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#333',
    fontWeight: '300',
    marginTop: -2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  exportButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exportButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  periodSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  periodButtonActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  periodButtonText: {
    fontSize: 12,
    color: '#666',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#4A90E2',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  tabTextActive: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loader: {
    marginTop: 40,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginTop: 16,
    marginBottom: 8,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  incomeCard: {
    backgroundColor: '#e8f5e9',
  },
  expenseCard: {
    backgroundColor: '#ffebee',
  },
  profitCard: {
    backgroundColor: '#e3f2fd',
  },
  marginCard: {
    backgroundColor: '#fff3e0',
  },
  warningCard: {
    backgroundColor: '#fff8e1',
  },
  dangerCard: {
    backgroundColor: '#ffebee',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rowLabel: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  truncate: {
    numberOfLines: 1,
  },
  rowValues: {
    flexDirection: 'row',
    gap: 12,
  },
  rowValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  rowValueIncome: {
    fontSize: 13,
    color: '#2e7d32',
    fontWeight: '600',
    minWidth: 70,
    textAlign: 'right',
  },
  rowValueExpense: {
    fontSize: 13,
    color: '#c62828',
    fontWeight: '600',
    minWidth: 70,
    textAlign: 'right',
  },
  rowValueNet: {
    fontSize: 13,
    fontWeight: '600',
    minWidth: 70,
    textAlign: 'right',
  },
  rowValueSecondary: {
    fontSize: 13,
    color: '#666',
  },
  positive: {
    color: '#2e7d32',
  },
  negative: {
    color: '#c62828',
  },
  warningText: {
    color: '#f57c00',
  },
  dangerText: {
    color: '#c62828',
  },
  periodInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  moreInfo: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
