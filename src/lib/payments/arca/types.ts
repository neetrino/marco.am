export type ArcaRegisterResponse = {
  errorCode?: number | string;
  errorMessage?: string;
  orderId?: string;
  formUrl?: string;
};

export type ArcaExtendedStatusResponse = {
  errorCode?: number | string;
  errorMessage?: string;
  orderNumber?: string;
  orderStatus?: number | string;
  actionCode?: number | string;
  paymentAmountInfo?: {
    paymentState?: string | number;
    depositedAmount?: number | string;
    approvedAmount?: number | string;
  };
  cardAuthInfo?: {
    pan?: string;
  };
};
