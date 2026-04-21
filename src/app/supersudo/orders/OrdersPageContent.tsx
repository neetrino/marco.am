'use client';

import { useTranslation } from '../../../lib/i18n-client';
import { usePathname } from 'next/navigation';
import { AdminPageLayout } from '../components/AdminPageLayout';
import { useOrders } from './useOrders';
import { OrdersFilters } from './components/OrdersFilters';
import { BulkSelectionControls } from './components/BulkSelectionControls';
import { OrdersTable } from './components/OrdersTable';
import { OrderDetailsModal } from './components/OrderDetailsModal';

export function OrdersPageContent() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const currentPath = pathname || '/supersudo/orders';
  const {
    orders,
    loading,
    statusFilter,
    paymentStatusFilter,
    searchQuery,
    page,
    meta,
    sortBy,
    sortOrder,
    updatingStatuses,
    updatingPaymentStatuses,
    updateMessage,
    selectedIds,
    bulkDeleting,
    selectedOrderId,
    orderDetails,
    loadingOrderDetails,
    savingAdminNotes,
    setStatusFilter,
    setPaymentStatusFilter,
    setSearchQuery,
    setPage,
    formatCurrency,
    handleViewOrderDetails,
    handleCloseModal,
    toggleSelect,
    toggleSelectAll,
    handleSort,
    handleBulkDelete,
    handleStatusChange,
    handlePaymentStatusChange,
    handleAdminNotesSave,
    router,
    searchParams,
  } = useOrders();

  return (
    <AdminPageLayout
      currentPath={currentPath}
      router={router}
      t={t}
      title={t('admin.orders.title')}
      backLabel={t('admin.orders.backToAdmin')}
      onBack={() => router.push('/supersudo')}
    >
      <div className="space-y-5">
        <OrdersFilters
          statusFilter={statusFilter}
          paymentStatusFilter={paymentStatusFilter}
          searchQuery={searchQuery}
          updateMessage={updateMessage}
          setStatusFilter={setStatusFilter}
          setPaymentStatusFilter={setPaymentStatusFilter}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
          router={router}
          searchParams={searchParams}
        />

        <BulkSelectionControls
          selectedCount={selectedIds.size}
          onBulkDelete={handleBulkDelete}
          bulkDeleting={bulkDeleting}
        />

        <OrdersTable
          orders={orders}
          loading={loading}
          selectedIds={selectedIds}
          updatingStatuses={updatingStatuses}
          updatingPaymentStatuses={updatingPaymentStatuses}
          sortBy={sortBy}
          sortOrder={sortOrder}
          page={page}
          meta={meta}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onSort={handleSort}
          onViewDetails={handleViewOrderDetails}
          onStatusChange={handleStatusChange}
          onPaymentStatusChange={handlePaymentStatusChange}
          onPageChange={(newPage) => setPage(newPage)}
          formatCurrency={formatCurrency}
        />

        {selectedOrderId && (
          <OrderDetailsModal
            orderDetails={orderDetails}
            loading={loadingOrderDetails}
            savingAdminNotes={savingAdminNotes}
            onSaveAdminNotes={handleAdminNotesSave}
            onClose={handleCloseModal}
            formatCurrency={formatCurrency}
          />
        )}
      </div>
    </AdminPageLayout>
  );
}
