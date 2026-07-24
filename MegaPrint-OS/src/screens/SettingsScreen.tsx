import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { workshopConfigRepository, licenseRepository } from '../database/repositories';
import type { WorkshopConfig, LicenseInfo, AppFeature } from '../types';

const COLORS = {
  primary: '#2563EB',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  background: '#F3F4F6',
  card: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
};

export default function SettingsScreen() {
  const [activeTab, setActiveTab] = useState<'workshop' | 'license' | 'features'>('workshop');
  const [loading, setLoading] = useState(true);
  
  // Workshop config state
  const [config, setConfig] = useState<WorkshopConfig | null>(null);
  const [editingConfig, setEditingConfig] = useState<Partial<WorkshopConfig>>({});
  
  // License state
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [licenseKey, setLicenseKey] = useState('');
  const [activating, setActivating] = useState(false);
  const [expirationInfo, setExpirationInfo] = useState<{ isExpired: boolean; daysRemaining: number } | null>(null);
  
  // Features state
  const [features, setFeatures] = useState<AppFeature[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [configData, licenseData, featuresData] = await Promise.all([
        workshopConfigRepository.getConfig(),
        licenseRepository.getCurrentLicense(),
        licenseRepository.getAllFeatures(),
      ]);
      
      setConfig(configData);
      setEditingConfig(configData || {});
      setLicense(licenseData);
      setFeatures(featuresData);
      
      if (licenseData) {
        const expInfo = await licenseRepository.checkLicenseExpiration();
        setExpirationInfo(expInfo);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Error', 'No se pudo cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWorkshopConfig = async () => {
    try {
      await workshopConfigRepository.updateOrCreate(editingConfig);
      Alert.alert('Éxito', 'Configuración guardada correctamente');
      loadData();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la configuración');
    }
  };

  const handleActivateLicense = async () => {
    if (!licenseKey.trim()) {
      Alert.alert('Error', 'Ingrese una clave de licencia');
      return;
    }

    setActivating(true);
    try {
      const deviceId = 'device-' + Math.random().toString(36).substr(2, 9);
      const result = await licenseRepository.activateLicense({
        licenseKey: licenseKey.trim(),
        deviceId,
        workshopName: config?.workshopName || 'Mi Taller',
        email: config?.email || '',
      });

      if (result.success) {
        Alert.alert('Éxito', result.message);
        setLicenseKey('');
        loadData();
      } else {
        Alert.alert('Error', result.message || result.error);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo activar la licencia');
    } finally {
      setActivating(false);
    }
  };

  const handleDeactivateLicense = () => {
    Alert.alert(
      'Desactivar Licencia',
      '¿Está seguro que desea desactivar la licencia actual?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: async () => {
            try {
              await licenseRepository.deactivateLicense();
              Alert.alert('Licencia desactivada');
              loadData();
            } catch (error) {
              Alert.alert('Error', 'No se pudo desactivar la licencia');
            }
          }
        }
      ]
    );
  };

  const handleToggleFeature = async (featureId: string, currentValue: boolean) => {
    try {
      await licenseRepository.updateFeature(featureId, !currentValue);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la feature');
    }
  };

  const getLicenseTypeColor = (type: string) => {
    switch (type) {
      case 'TRIAL': return COLORS.warning;
      case 'BASIC': return COLORS.primary;
      case 'PRO': return COLORS.success;
      case 'ENTERPRISE': return '#8B5CF6';
      default: return COLORS.textSecondary;
    }
  };

  const getLicenseTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      TRIAL: '🧪 Prueba',
      BASIC: '📦 Básico',
      PRO: '⭐ Profesional',
      ENTERPRISE: '🏢 Enterprise',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando configuración...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'workshop' && styles.activeTab]}
          onPress={() => setActiveTab('workshop')}
        >
          <Ionicons 
            name="storefront-outline" 
            size={20} 
            color={activeTab === 'workshop' ? COLORS.primary : COLORS.textSecondary} 
          />
          <Text style={[styles.tabText, activeTab === 'workshop' && styles.activeTabText]}>
            Taller
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'license' && styles.activeTab]}
          onPress={() => setActiveTab('license')}
        >
          <Ionicons 
            name="key-outline" 
            size={20} 
            color={activeTab === 'license' ? COLORS.primary : COLORS.textSecondary} 
          />
          <Text style={[styles.tabText, activeTab === 'license' && styles.activeTabText]}>
            Licencia
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'features' && styles.activeTab]}
          onPress={() => setActiveTab('features')}
        >
          <Ionicons 
            name="apps-outline" 
            size={20} 
            color={activeTab === 'features' ? COLORS.primary : COLORS.textSecondary} 
          />
          <Text style={[styles.tabText, activeTab === 'features' && styles.activeTabText]}>
            Funciones
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* WORKSHOP CONFIG TAB */}
        {activeTab === 'workshop' && (
          <View style={styles.content}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Información del Taller</Text>
              
              <Text style={styles.label}>Nombre del Taller *</Text>
              <TextInput
                style={styles.input}
                value={editingConfig.workshopName || ''}
                onChangeText={(text) => setEditingConfig({ ...editingConfig, workshopName: text })}
                placeholder="Ej: MegaPrint Service Center"
              />
              
              <Text style={styles.label}>Dirección</Text>
              <TextInput
                style={styles.input}
                value={editingConfig.address || ''}
                onChangeText={(text) => setEditingConfig({ ...editingConfig, address: text })}
                placeholder="Dirección física del taller"
                multiline
              />
              
              <Text style={styles.label}>Teléfono</Text>
              <TextInput
                style={styles.input}
                value={editingConfig.phone || ''}
                onChangeText={(text) => setEditingConfig({ ...editingConfig, phone: text })}
                placeholder="+51 999 999 999"
                keyboardType="phone-pad"
              />
              
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={editingConfig.email || ''}
                onChangeText={(text) => setEditingConfig({ ...editingConfig, email: text })}
                placeholder="contacto@mitaller.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <Text style={styles.label}>RUC / NIT / Tax ID</Text>
              <TextInput
                style={styles.input}
                value={editingConfig.taxId || ''}
                onChangeText={(text) => setEditingConfig({ ...editingConfig, taxId: text })}
                placeholder="Número de identificación tributaria"
              />
              
              <Text style={styles.label}>Símbolo de Moneda</Text>
              <TextInput
                style={styles.input}
                value={editingConfig.currencySymbol || '$'}
                onChangeText={(text) => setEditingConfig({ ...editingConfig, currencySymbol: text })}
                placeholder="$"
              />
              
              <Text style={styles.label}>Días de Garantía por Defecto</Text>
              <TextInput
                style={styles.input}
                value={String(editingConfig.warrantyDays || 30)}
                onChangeText={(text) => setEditingConfig({ ...editingConfig, warrantyDays: parseInt(text) || 30 })}
                placeholder="30"
                keyboardType="numeric"
              />
              
              <Text style={styles.label}>Términos de Garantía</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editingConfig.warrantyTerms || ''}
                onChangeText={(text) => setEditingConfig({ ...editingConfig, warrantyTerms: text })}
                placeholder="Describa los términos y condiciones de garantía..."
                multiline
                numberOfLines={4}
              />
              
              <TouchableOpacity style={styles.button} onPress={handleSaveWorkshopConfig}>
                <Ionicons name="save-outline" size={20} color="#FFF" />
                <Text style={styles.buttonText}>Guardar Configuración</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* LICENSE TAB */}
        {activeTab === 'license' && (
          <View style={styles.content}>
            {/* Current License Info */}
            {license && license.isActive && (
              <View style={[styles.card, styles.licenseCard]}>
                <View style={styles.licenseHeader}>
                  <View style={[styles.licenseBadge, { backgroundColor: getLicenseTypeColor(license.licenseType) }]}>
                    <Text style={styles.licenseBadgeText}>{getLicenseTypeLabel(license.licenseType)}</Text>
                  </View>
                  {expirationInfo && (
                    <View style={[
                      styles.expirationBadge,
                      expirationInfo.isExpired ? styles.expiredBadge : 
                      expirationInfo.daysRemaining <= 7 ? styles.expiringSoonBadge : styles.validBadge
                    ]}>
                      <Ionicons 
                        name={expirationInfo.isExpired ? 'warning' : 'calendar-outline'} 
                        size={16} 
                        color="#FFF" 
                      />
                      <Text style={styles.expirationText}>
                        {expirationInfo.isExpired ? 'Expirada' : 
                         expirationInfo.daysRemaining <= 7 ? `Expira en ${expirationInfo.daysRemaining} días` :
                         `Válida por ${expirationInfo.daysRemaining} días más`}
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.licenseInfo}>
                  <View style={styles.licenseInfoRow}>
                    <Ionicons name="business-outline" size={18} color={COLORS.textSecondary} />
                    <Text style={styles.licenseInfoText}>{license.workshopName || 'N/A'}</Text>
                  </View>
                  
                  <View style={styles.licenseInfoRow}>
                    <Ionicons name="mail-outline" size={18} color={COLORS.textSecondary} />
                    <Text style={styles.licenseInfoText}>{license.email || 'N/A'}</Text>
                  </View>
                  
                  <View style={styles.licenseInfoRow}>
                    <Ionicons name="phone-portrait-outline" size={18} color={COLORS.textSecondary} />
                    <Text style={styles.licenseInfoText}>Dispositivos: {license.maxDevices}</Text>
                  </View>
                  
                  <View style={styles.licenseInfoRow}>
                    <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.success} />
                    <Text style={styles.licenseInfoText}>
                      {license.features.length} funciones habilitadas
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={handleDeactivateLicense}>
                  <Ionicons name="lock-closed-outline" size={20} color="#FFF" />
                  <Text style={styles.buttonText}>Desactivar Licencia</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Activate New License */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Activar Nueva Licencia</Text>
              
              <Text style={styles.label}>Clave de Licencia</Text>
              <TextInput
                style={styles.input}
                value={licenseKey}
                onChangeText={setLicenseKey}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                autoCapitalize="characters"
                editable={!activating}
              />
              
              <View style={styles.licenseTypesInfo}>
                <Text style={styles.infoTitle}>Tipos de licencia disponibles:</Text>
                <View style={styles.licenseTypeItem}>
                  <Text style={styles.licenseTypeCode}>TRIAL-DEMO-KEY</Text>
                  <Text style={styles.licenseTypeDesc}>30 días de prueba gratis</Text>
                </View>
                <View style={styles.licenseTypeItem}>
                  <Text style={styles.licenseTypeCode}>XXXX-PRO-XXXX</Text>
                  <Text style={styles.licenseTypeDesc}>Licencia Profesional (1 año)</Text>
                </View>
                <View style={styles.licenseTypeItem}>
                  <Text style={styles.licenseTypeCode}>XXXX-ENT-XXXX</Text>
                  <Text style={styles.licenseTypeDesc}>Licencia Enterprise (1 año)</Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={[styles.button, activating && styles.buttonDisabled]} 
                onPress={handleActivateLicense}
                disabled={activating}
              >
                {activating ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="key-outline" size={20} color="#FFF" />
                    <Text style={styles.buttonText}>Activar Licencia</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* FEATURES TAB */}
        {activeTab === 'features' && (
          <View style={styles.content}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Funciones de la Aplicación</Text>
              <Text style={styles.description}>
                Gestiona qué funciones están habilitadas en tu aplicación. 
                Las funciones marcadas con 🔒 requieren una licencia específica.
              </Text>
              
              {features.map((feature) => (
                <View key={feature.id} style={styles.featureItem}>
                  <View style={styles.featureInfo}>
                    <Text style={styles.featureName}>{feature.name}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                    {feature.requiresLicense && (
                      <View style={styles.requiresLicenseBadge}>
                        <Ionicons name="lock-closed" size={12} color="#FFF" />
                        <Text style={styles.requiresLicenseText}>
                          Requiere {feature.requiresLicense}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Switch
                    value={feature.enabled}
                    onValueChange={() => handleToggleFeature(feature.id, feature.enabled)}
                    trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                    thumbColor={feature.enabled ? COLORS.primary : '#F3F4F6'}
                  />
                </View>
              ))}
            </View>
            
            {license && (
              <View style={[styles.card, styles.licenseSummaryCard]}>
                <Text style={styles.cardTitle}>Tu Licencia Actual</Text>
                <View style={styles.licenseSummary}>
                  <Text style={styles.licenseSummaryType}>{getLicenseTypeLabel(license.licenseType)}</Text>
                  <Text style={styles.licenseSummaryStatus}>
                    {license.isActive ? '✅ Activa' : '❌ Inactiva'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 14,
    marginTop: 20,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: COLORS.danger,
    marginTop: 16,
  },
  // License styles
  licenseCard: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  licenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  licenseBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  licenseBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  expirationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  expiredBadge: {
    backgroundColor: COLORS.danger,
  },
  expiringSoonBadge: {
    backgroundColor: COLORS.warning,
  },
  validBadge: {
    backgroundColor: COLORS.success,
  },
  expirationText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  licenseInfo: {
    gap: 10,
  },
  licenseInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  licenseInfoText: {
    fontSize: 14,
    color: COLORS.text,
  },
  licenseTypesInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  licenseTypeItem: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  licenseTypeCode: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  licenseTypeDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  // Features styles
  featureItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  featureInfo: {
    flex: 1,
    marginRight: 12,
  },
  featureName: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  requiresLicenseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    gap: 4,
  },
  requiresLicenseText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '500',
  },
  licenseSummaryCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  licenseSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  licenseSummaryType: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  licenseSummaryStatus: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
