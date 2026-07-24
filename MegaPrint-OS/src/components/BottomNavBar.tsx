import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface BottomNavBarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onNavigate }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'LIST' && styles.activeTab]}
        onPress={() => onNavigate('LIST')}
      >
        <Text style={[styles.icon, activeTab === 'LIST' && styles.activeIcon]}>📋</Text>
        <Text style={[styles.label, activeTab === 'LIST' && styles.activeLabel]}>Órdenes</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'DASHBOARD' && styles.activeTab]}
        onPress={() => onNavigate('DASHBOARD')}
      >
        <Text style={[styles.icon, activeTab === 'DASHBOARD' && styles.activeIcon]}>📈</Text>
        <Text style={[styles.label, activeTab === 'DASHBOARD' && styles.activeLabel]}>Dashboard</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'NEW_ORDER' && styles.activeTab]}
        onPress={() => onNavigate('NEW_ORDER')}
      >
        <Text style={[styles.icon, activeTab === 'NEW_ORDER' && styles.activeIcon]}>➕</Text>
        <Text style={[styles.label, activeTab === 'NEW_ORDER' && styles.activeLabel]}>Nueva</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'REPORTS' && styles.activeTab]}
        onPress={() => onNavigate('REPORTS')}
      >
        <Text style={[styles.icon, activeTab === 'REPORTS' && styles.activeIcon]}>📊</Text>
        <Text style={[styles.label, activeTab === 'REPORTS' && styles.activeLabel]}>Reportes</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'SETTINGS' && styles.activeTab]}
        onPress={() => onNavigate('SETTINGS')}
      >
        <Text style={[styles.icon, activeTab === 'SETTINGS' && styles.activeIcon]}>⚙️</Text>
        <Text style={[styles.label, activeTab === 'SETTINGS' && styles.activeLabel]}>Ajustes</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
    paddingBottom: 5,
    paddingTop: 5,
    height: 65,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    backgroundColor: '#f0f2f5',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  icon: {
    fontSize: 22,
    marginBottom: 2,
  },
  activeIcon: {
    color: '#1877f2',
  },
  label: {
    fontSize: 11,
    color: '#65676b',
    fontWeight: '500',
  },
  activeLabel: {
    color: '#1877f2',
    fontWeight: '600',
  },
});

export default BottomNavBar;
