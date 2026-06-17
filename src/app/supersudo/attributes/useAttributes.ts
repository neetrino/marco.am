'use client';

import { useEffect, useState, useCallback, useRef, ChangeEvent } from 'react';
import { apiClient, getApiOrErrorMessage } from '../../../lib/api-client';
import { useTranslation } from '../../../lib/i18n-client';
import { showPopupConfirm } from '@/components/popup-service';
import { showToast } from '../../../components/Toast';
import { logger } from '@/lib/utils/logger';
import { processAdminImageFile } from '@/lib/utils/process-admin-image-file';
import { ADMIN_CACHE_KEYS } from '@/lib/admin/admin-cache-keys';
import { beginAdminDataFetch } from '@/lib/admin/admin-fetch-helpers';
import { dedupedAdminRequest } from '@/lib/admin/admin-request-dedup';
import {
  ADMIN_SESSION_CACHE_TTL_MS,
  readAdminSessionCache,
  writeAdminSessionCache,
} from '@/lib/admin/admin-session-cache';

export interface AttributeValue {
  id: string;
  value: string;
  label: string;
  colors?: string[];
  imageUrl?: string | null;
}

export interface Attribute {
  id: string;
  key: string;
  name: string;
  type: string;
  filterable: boolean;
  values: AttributeValue[];
}

export type UseAttributesReturn = ReturnType<typeof useAttributes>;

export function useAttributes() {
  const { t } = useTranslation();
  const cachedAttributes = readAdminSessionCache<{ data: Attribute[] }>(
    ADMIN_CACHE_KEYS.attributes,
    ADMIN_SESSION_CACHE_TTL_MS,
  );
  const hadCacheRef = useRef(cachedAttributes !== null);
  const [attributes, setAttributes] = useState<Attribute[]>(cachedAttributes?.data ?? []);
  const [loading, setLoading] = useState(cachedAttributes === null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<string | null>(null);
  const [editingAttributeName, setEditingAttributeName] = useState('');
  const [savingAttribute, setSavingAttribute] = useState(false);
  const [expandedAttributes, setExpandedAttributes] = useState<Set<string>>(new Set());
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
  });
  
  const [newValue, setNewValue] = useState('');
  const [addingValueTo, setAddingValueTo] = useState<string | null>(null);
  const [deletingValue, setDeletingValue] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<{ attributeId: string; value: AttributeValue } | null>(null);
  const [valueError, setValueError] = useState<string | null>(null);
  const [expandedValueId, setExpandedValueId] = useState<string | null>(null);
  
  // Inline edit form states
  const [editingLabel, setEditingLabel] = useState('');
  const [editingColors, setEditingColors] = useState<string[]>([]);
  const [editingImageUrl, setEditingImageUrl] = useState<string | null>(null);
  const [savingValue, setSavingValue] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [movingAttributeId, setMovingAttributeId] = useState<string | null>(null);
  const [draggingAttributeId, setDraggingAttributeId] = useState<string | null>(null);
  const [dragOverAttributeId, setDragOverAttributeId] = useState<string | null>(null);
  const [movingValueId, setMovingValueId] = useState<string | null>(null);
  const [draggingValueId, setDraggingValueId] = useState<string | null>(null);
  const [dragOverValueId, setDragOverValueId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAttributes = useCallback(async (options?: { force?: boolean }) => {
    const cacheKey = ADMIN_CACHE_KEYS.attributes;
    const cached = readAdminSessionCache<{ data: Attribute[] }>(
      cacheKey,
      ADMIN_SESSION_CACHE_TTL_MS,
    );
    if (!options?.force && cached !== null) {
      setAttributes(cached.data ?? []);
      setLoading(false);
      hadCacheRef.current = true;
      return;
    }

    try {
      beginAdminDataFetch(hadCacheRef.current, setLoading);
      const response = await dedupedAdminRequest(cacheKey, () =>
        apiClient.get<{ data: Attribute[] }>('/api/v1/supersudo/attributes'),
      );
      setAttributes(response.data ?? []);
      writeAdminSessionCache(cacheKey, response);
      hadCacheRef.current = true;
    } catch (err) {
      logger.error('Admin attributes fetch failed', { error: err });
      if (!hadCacheRef.current) {
        setAttributes([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

  const handleCreateAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showToast(t('admin.attributes.fillName'), 'warning');
      return;
    }

    // Auto-generate key from name
    const autoKey = formData.name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    try {
      logger.devLog('🆕 [ADMIN] Creating attribute:', autoKey);
      await apiClient.post('/api/v1/supersudo/attributes', {
        name: formData.name.trim(),
        key: autoKey,
        type: 'select',
        filterable: true,
        locale: 'en',
      });
      
      logger.devLog('✅ [ADMIN] Attribute created successfully');
      setShowAddForm(false);
      setFormData({ name: '' });
      fetchAttributes({ force: true });
      showToast(t('admin.attributes.createdSuccess'), 'success');
    } catch (err: unknown) {
      console.error('❌ [ADMIN] Error creating attribute:', err);
      const errorMessage = getApiOrErrorMessage(err, 'Failed to create attribute');
      showToast(t('admin.attributes.errorCreating').replace('{message}', errorMessage), 'error');
    }
  };

  const handleDeleteAttribute = async (attributeId: string, attributeName: string) => {
    if (!(await showPopupConfirm(t('admin.attributes.deleteConfirm').replace('{name}', attributeName)))) {
      return;
    }

    try {
      logger.devLog(`🗑️ [ADMIN] Deleting attribute: ${attributeName} (${attributeId})`);
      await apiClient.delete(`/api/v1/supersudo/attributes/${attributeId}`);
      logger.devLog('✅ [ADMIN] Attribute deleted successfully');
      fetchAttributes({ force: true });
      showToast(t('admin.attributes.deletedSuccess'), 'success');
    } catch (err: unknown) {
      console.error('❌ [ADMIN] Error deleting attribute:', err);
      const errorMessage = getApiOrErrorMessage(err, 'Failed to delete attribute');
      showToast(t('admin.attributes.errorDeleting').replace('{message}', errorMessage), 'error');
    }
  };

  const handleUpdateAttributeName = async (attributeId: string) => {
    const trimmedName = editingAttributeName.trim();
    
    if (!trimmedName) {
      showToast(t('admin.attributes.fillName'), 'warning');
      return;
    }

    try {
      setSavingAttribute(true);
      logger.devLog(`✏️ [ADMIN] Updating attribute name: ${attributeId} -> ${trimmedName}`);
      await apiClient.patch(`/api/v1/supersudo/attributes/${attributeId}/translations`, {
        name: trimmedName,
        locale: 'en',
      });
      logger.devLog('✅ [ADMIN] Attribute name updated successfully');
      setEditingAttribute(null);
      setEditingAttributeName('');
      fetchAttributes({ force: true });
      showToast(t('admin.attributes.nameUpdatedSuccess'), 'success');
    } catch (err: unknown) {
      console.error('❌ [ADMIN] Error updating attribute name:', err);
      const errorMessage = getApiOrErrorMessage(err, 'Failed to update attribute name');
      showToast(errorMessage, 'error');
    } finally {
      setSavingAttribute(false);
    }
  };

  const toggleAttributeEdit = (attribute: Attribute) => {
    if (editingAttribute === attribute.id) {
      // Close
      setEditingAttribute(null);
      setEditingAttributeName('');
    } else {
      // Open
      setEditingAttribute(attribute.id);
      setEditingAttributeName(attribute.name);
    }
  };

  const handleAddValue = async (attributeId: string) => {
    const trimmedValue = newValue.trim();
    
    if (!trimmedValue) {
      showToast(t('admin.attributes.enterValue'), 'warning');
      setValueError(t('admin.attributes.enterValue'));
      return;
    }

    // Find the attribute
    const attribute = attributes.find((attr) => attr.id === attributeId);
    if (!attribute) {
      showToast(t('admin.attributes.attributeNotFound'), 'error');
      return;
    }

    // Check for duplicates on frontend (case-insensitive, normalized)
    const normalizedNewValue = trimmedValue.toLowerCase().trim();
    const existingValue = attribute.values.find((val) => {
      const normalizedExisting = val.label.toLowerCase().trim();
      return normalizedExisting === normalizedNewValue;
    });

    if (existingValue) {
      const errorMsg = t('admin.attributes.valueAlreadyExists').replace('{value}', trimmedValue);
      showToast(errorMsg, 'error', 5000);
      setValueError(errorMsg);
      return;
    }

    // Clear any previous errors
    setValueError(null);

    try {
      setAddingValueTo(attributeId);
      logger.devLog('➕ [ADMIN] Adding value to attribute:', attributeId, trimmedValue);
      await apiClient.post(`/api/v1/supersudo/attributes/${attributeId}/values`, {
        label: trimmedValue,
        locale: 'en',
      });
      
      logger.devLog('✅ [ADMIN] Value added successfully');
      setNewValue('');
      setValueError(null);
      setAddingValueTo(null);
      showToast(t('admin.attributes.valueAddedSuccess'), 'success');
      fetchAttributes({ force: true });
    } catch (err: unknown) {
      console.error('❌ [ADMIN] Error adding value:', err);
      const errorMessage = getApiOrErrorMessage(err, t('admin.attributes.failedToAddValue'));
      
      // Check if it's a duplicate error from backend
      if (errorMessage.includes('already exists') || errorMessage.includes('уже существует')) {
        const duplicateMsg = t('admin.attributes.valueAlreadyExists').replace('{value}', trimmedValue);
        showToast(duplicateMsg, 'error', 5000);
        setValueError(duplicateMsg);
      } else {
        showToast(errorMessage, 'error', 5000);
        setValueError(errorMessage);
      }
      setAddingValueTo(null);
    }
  };

  const handleDeleteValue = async (attributeId: string, valueId: string, valueLabel: string) => {
    if (!(await showPopupConfirm(t('admin.attributes.deleteValueConfirm').replace('{label}', valueLabel)))) {
      return;
    }

    try {
      setDeletingValue(valueId);
      logger.devLog(`🗑️ [ADMIN] Deleting value: ${valueLabel} (${valueId})`);
      await apiClient.delete(`/api/v1/supersudo/attributes/${attributeId}/values/${valueId}`);
      logger.devLog('✅ [ADMIN] Value deleted successfully');
      fetchAttributes({ force: true });
      setDeletingValue(null);
      showToast(t('admin.attributes.valueDeletedSuccess'), 'success');
    } catch (err: unknown) {
      console.error('❌ [ADMIN] Error deleting value:', err);
      const errorMessage = getApiOrErrorMessage(err, 'Failed to delete value');
      showToast(t('admin.attributes.errorDeletingValue').replace('{message}', errorMessage), 'error');
      setDeletingValue(null);
    }
  };

  const handleUpdateValue = async (data: {
    label?: string;
    colors?: string[];
    imageUrl?: string | null;
  }) => {
    if (!editingValue) return;

    try {
      logger.devLog('✏️ [ADMIN] Updating value:', { 
        valueId: editingValue.value.id, 
        attributeId: editingValue.attributeId,
        data,
        colorsType: typeof data.colors,
        colorsIsArray: Array.isArray(data.colors),
        colorsLength: data.colors?.length
      });
      await apiClient.patch(`/api/v1/supersudo/attributes/${editingValue.attributeId}/values/${editingValue.value.id}`, {
        ...data,
        locale: 'en',
      });
      logger.devLog('✅ [ADMIN] Value updated successfully');
      fetchAttributes({ force: true });
      showToast(t('admin.attributes.valueUpdatedSuccess'), 'success');
    } catch (err: unknown) {
      console.error('❌ [ADMIN] Error updating value:', err);
      const errorMessage = getApiOrErrorMessage(err, 'Failed to update value');
      showToast(t('admin.attributes.errorUpdatingValue')?.replace('{message}', errorMessage) || errorMessage, 'error');
      throw err;
    }
  };

  const toggleValueEdit = (attributeId: string, value: AttributeValue) => {
    if (expandedValueId === value.id) {
      // Close
      setExpandedValueId(null);
      setEditingValue(null);
      setEditingLabel('');
      setEditingColors([]);
      setEditingImageUrl(null);
    } else {
      // Open
      setExpandedValueId(value.id);
      setEditingValue({ attributeId, value });
      setEditingLabel(value.label);
      setEditingColors(value.colors || []);
      setEditingImageUrl(value.imageUrl || null);
    }
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const imageFile = files[0];
    if (!imageFile) {
      return;
    }

    try {
      setImageUploading(true);
      const base64 = await processAdminImageFile(imageFile, 'catalog');
      setEditingImageUrl(base64);
    } catch (error: unknown) {
      console.error('❌ [ADMIN] Error uploading image:', error);
      showToast(getApiOrErrorMessage(error, t('admin.attributes.valueModal.failedToProcessImage')), 'error');
    } finally {
      setImageUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setEditingImageUrl(null);
  };

  const handleSaveInlineValue = async () => {
    if (!editingValue) return;

    try {
      setSavingValue(true);
      await handleUpdateValue({
        label: editingLabel.trim() !== editingValue.value.label ? editingLabel.trim() : undefined,
        colors: editingColors.length > 0 ? editingColors : undefined,
        imageUrl: editingImageUrl,
      });
      // Close the expanded form
      setExpandedValueId(null);
      setEditingValue(null);
      setEditingLabel('');
      setEditingColors([]);
      setEditingImageUrl(null);
    } catch (error: unknown) {
      console.error('❌ [ADMIN] Error saving value:', error);
    } finally {
      setSavingValue(false);
    }
  };

  const toggleExpand = (attributeId: string) => {
    setExpandedAttributes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(attributeId)) {
        newSet.delete(attributeId);
      } else {
        newSet.add(attributeId);
      }
      return newSet;
    });
  };

  const reorderAttributesOptimistically = (attributeId: string, targetAttributeId: string) => {
    setAttributes((prev) => {
      const sourceIndex = prev.findIndex((attribute) => attribute.id === attributeId);
      const targetIndex = prev.findIndex((attribute) => attribute.id === targetAttributeId);
      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
        return prev;
      }
      const next = [...prev];
      const [moving] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moving);
      return next;
    });
  };

  const reorderValuesOptimistically = (
    attributeId: string,
    valueId: string,
    targetValueId: string,
  ) => {
    setAttributes((prev) =>
      prev.map((attribute) => {
        if (attribute.id !== attributeId) {
          return attribute;
        }
        const sourceIndex = attribute.values.findIndex((value) => value.id === valueId);
        const targetIndex = attribute.values.findIndex((value) => value.id === targetValueId);
        if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
          return attribute;
        }
        const nextValues = [...attribute.values];
        const [moving] = nextValues.splice(sourceIndex, 1);
        nextValues.splice(targetIndex, 0, moving);
        return {
          ...attribute,
          values: nextValues,
        };
      }),
    );
  };

  const handleReorderAttribute = async (attributeId: string, targetAttributeId: string) => {
    if (!attributeId || !targetAttributeId || attributeId === targetAttributeId) {
      return;
    }
    const previous = attributes;
    setMovingAttributeId(attributeId);
    reorderAttributesOptimistically(attributeId, targetAttributeId);
    try {
      await apiClient.post('/api/v1/supersudo/attributes/reorder', {
        attributeId,
        targetAttributeId,
      });
    } catch (error: unknown) {
      setAttributes(previous);
      const message = getApiOrErrorMessage(error, t('admin.common.unknownErrorFallback'));
      showToast(message, 'error');
    } finally {
      setMovingAttributeId(null);
      setDraggingAttributeId(null);
      setDragOverAttributeId(null);
    }
  };

  const handleReorderValue = async (
    attributeId: string,
    valueId: string,
    targetValueId: string,
  ) => {
    if (!attributeId || !valueId || !targetValueId || valueId === targetValueId) {
      return;
    }
    const previous = attributes;
    setMovingValueId(valueId);
    reorderValuesOptimistically(attributeId, valueId, targetValueId);
    try {
      await apiClient.post(`/api/v1/supersudo/attributes/${attributeId}/values/reorder`, {
        valueId,
        targetValueId,
      });
    } catch (error: unknown) {
      setAttributes(previous);
      const message = getApiOrErrorMessage(error, t('admin.common.unknownErrorFallback'));
      showToast(message, 'error');
    } finally {
      setMovingValueId(null);
      setDraggingValueId(null);
      setDragOverValueId(null);
    }
  };

  return {
    // State
    attributes,
    loading,
    showAddForm,
    editingAttribute,
    editingAttributeName,
    savingAttribute,
    expandedAttributes,
    formData,
    newValue,
    addingValueTo,
    deletingValue,
    editingValue,
    valueError,
    expandedValueId,
    editingLabel,
    editingColors,
    editingImageUrl,
    savingValue,
    imageUploading,
    movingAttributeId,
    draggingAttributeId,
    dragOverAttributeId,
    movingValueId,
    draggingValueId,
    dragOverValueId,
    fileInputRef,
    // Actions
    setShowAddForm,
    setFormData,
    setNewValue,
    setEditingAttributeName,
    setEditingLabel,
    setEditingColors,
    setEditingImageUrl,
    setValueError,
    setDraggingAttributeId,
    setDragOverAttributeId,
    setDraggingValueId,
    setDragOverValueId,
    handleCreateAttribute,
    handleDeleteAttribute,
    handleUpdateAttributeName,
    toggleAttributeEdit,
    handleAddValue,
    handleDeleteValue,
    toggleValueEdit,
    handleImageUpload,
    handleRemoveImage,
    handleSaveInlineValue,
    toggleExpand,
    handleReorderAttribute,
    handleReorderValue,
  };
}



