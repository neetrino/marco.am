'use client';

import { Suspense, useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth/AuthContext';
import { useTranslation } from '../../lib/i18n-client';
import { useProfilePage } from './useProfilePage';
import { ProfileHeader } from './ProfileHeader';
import { ProfileSidebarNav } from './ProfileSidebarNav';
import { ProfileDashboard } from './ProfileDashboard';
import { ProfilePersonalInfo } from './ProfilePersonalInfo';
import { ProfileAddresses } from './ProfileAddresses';
import { ProfileOrders } from './ProfileOrders';
import { ProfilePassword } from './ProfilePassword';
import { ProfileDeleteAccount } from './ProfileDeleteAccount';
import { OrderDetailsModal } from './OrderDetailsModal';
import { buildProfileTabs } from './ProfileTabsConfig';
import type { ProfileTab, ProfileTabConfig } from './types';

function ProfilePageContent() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const { t } = useTranslation();
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  
  const {
    loading,
    error,
    success,
    setError: _setError,
    setSuccess: _setSuccess,
    profile,
    activeTab,
    handleTabChange,
    personalInfo,
    setPersonalInfo,
    savingPersonal,
    handleSavePersonalInfo,
    showAddressForm,
    setShowAddressForm,
    editingAddress,
    addressForm,
    setAddressForm,
    savingAddress,
    handleSaveAddress,
    handleDeleteAddress,
    handleSetDefaultAddress,
    handleEditAddress,
    resetAddressForm,
    passwordForm,
    setPasswordForm,
    savingPassword,
    handleChangePassword,
    dashboardData,
    dashboardLoading,
    orders,
    ordersLoading,
    ordersPage,
    setOrdersPage,
    ordersMeta,
    ordersStatusFilter,
    handleOrdersStatusFilterChange,
    selectedOrder,
    setSelectedOrder,
    orderDetailsLoading,
    orderDetailsError,
    isReordering,
    handleOrderClick,
    handleReOrder,
    currency,
  } = useProfilePage();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    const updateViewport = () => setIsMobileViewport(mediaQuery.matches);
    updateViewport();

    mediaQuery.addEventListener('change', updateViewport);
    return () => mediaQuery.removeEventListener('change', updateViewport);
  }, []);

  useEffect(() => {
    if (!isMobileViewport || activeTab !== 'dashboard') {
      return;
    }

    handleTabChange('orders');
  }, [activeTab, handleTabChange, isMobileViewport]);

  if (authLoading || loading) {
    return (
      <div className="marco-header-container py-12">
        <div className="text-center">
          <p className="text-gray-600">{t('profile.common.loadingProfile')}</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }
  const tabs: ProfileTabConfig[] = buildProfileTabs(t);

  const handleProfileTabChange = (tab: ProfileTab) => {
    handleTabChange(tab);
    setIsMobileSheetOpen(true);
  };
  const activeTabLabel = tabs.find((tab) => tab.id === activeTab)?.label ?? t('profile.myProfile');

  return (
    <div className="marco-header-container py-2 lg:py-8">
      <div className="flex w-full max-w-none flex-col gap-2 px-3 py-2 lg:flex-row lg:items-start lg:gap-12 lg:px-0 lg:py-0">
        <div className="w-full shrink-0 lg:sticky lg:top-24 lg:w-[27rem] lg:self-start">
          <ProfileHeader
            profile={profile}
            t={t}
          />
          <div className="mt-1.5 lg:mt-3">
            <ProfileSidebarNav
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={handleProfileTabChange}
              t={t}
            />
          </div>
        </div>

        {isMobileSheetOpen && (
          <button
            type="button"
            onClick={() => setIsMobileSheetOpen(false)}
            className="fixed inset-0 z-[1100] bg-black/40 lg:hidden"
            aria-label={t('common.buttons.close')}
          />
        )}

        <div
          className={`min-w-0 flex-1 ${
            isMobileSheetOpen
              ? 'fixed inset-x-0 bottom-0 z-[1110] block h-[75vh] rounded-t-3xl border border-slate-200 bg-white shadow-[0_-20px_60px_rgba(15,23,42,0.18)] lg:static lg:z-auto lg:h-auto lg:rounded-none lg:border-0 lg:bg-transparent lg:shadow-none'
              : 'hidden lg:block'
          }`}
        >
          {isMobileSheetOpen && (
            <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
              <div className="h-1.5 w-12 rounded-full bg-slate-300" />
              <p className="text-sm font-semibold text-slate-900">{activeTabLabel}</p>
              <button
                type="button"
                onClick={() => setIsMobileSheetOpen(false)}
                className="rounded-md px-2 py-1 text-sm text-slate-600 transition hover:bg-slate-100"
              >
                {t('common.buttons.close')}
              </button>
            </div>
          )}

          <div className={`${isMobileSheetOpen ? 'h-[calc(75vh-58px)] overflow-y-auto p-4 lg:h-auto lg:overflow-visible lg:p-0' : ''}`}>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          {activeTab === 'dashboard' && !isMobileViewport && (
            <ProfileDashboard
              dashboardData={dashboardData}
              dashboardLoading={dashboardLoading}
              currency={currency}
              onTabChange={handleTabChange}
              onOrderClick={handleOrderClick}
              t={t}
            />
          )}

          {activeTab === 'personal' && (
            <ProfilePersonalInfo
              personalInfo={personalInfo}
              setPersonalInfo={setPersonalInfo}
              savingPersonal={savingPersonal}
              onSave={handleSavePersonalInfo}
              profile={profile}
              t={t}
            />
          )}

          {activeTab === 'addresses' && (
            <ProfileAddresses
              profile={profile}
              showAddressForm={showAddressForm}
              setShowAddressForm={setShowAddressForm}
              editingAddress={editingAddress}
              addressForm={addressForm}
              setAddressForm={setAddressForm}
              savingAddress={savingAddress}
              onSave={handleSaveAddress}
              onDelete={handleDeleteAddress}
              onSetDefault={handleSetDefaultAddress}
              onEdit={handleEditAddress}
              onResetForm={resetAddressForm}
              t={t}
            />
          )}

          {activeTab === 'orders' && (
            <ProfileOrders
              orders={orders}
              ordersLoading={ordersLoading}
              ordersPage={ordersPage}
              setOrdersPage={setOrdersPage}
              ordersMeta={ordersMeta}
              ordersStatusFilter={ordersStatusFilter}
              onOrdersStatusFilterChange={handleOrdersStatusFilterChange}
              currency={currency}
              onOrderClick={handleOrderClick}
              t={t}
            />
          )}

          {activeTab === 'password' && (
            <ProfilePassword
              passwordForm={passwordForm}
              setPasswordForm={setPasswordForm}
              savingPassword={savingPassword}
              onSave={handleChangePassword}
              t={t}
            />
          )}

          {activeTab === 'deleteAccount' && <ProfileDeleteAccount t={t} />}

          {selectedOrder && (
            <OrderDetailsModal
              selectedOrder={selectedOrder}
              orderDetailsLoading={orderDetailsLoading}
              orderDetailsError={orderDetailsError}
              isReordering={isReordering}
              currency={currency}
              onClose={() => setSelectedOrder(null)}
              onReOrder={handleReOrder}
              t={t}
            />
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="marco-header-container py-12 text-center text-gray-600">Loading profile...</div>}>
      <ProfilePageContent />
    </Suspense>
  );
}
