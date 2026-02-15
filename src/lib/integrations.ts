import {
  IntegrationProvider,
  IntegrationConfig,
  Invoice,
  ExtractedData,
} from '@/types';
import axios, { AxiosInstance } from 'axios';

interface QuickBooksInvoicePayload {
  Line: Array<{
    Amount: number;
    DetailType: string;
    SalesItemLineDetail: {
      ItemRef: { value: string; name: string };
      Qty: number;
      UnitPrice: number;
      TaxCodeRef?: { value: string };
    };
    Description: string;
  }>;
  CustomerRef: { value: string; name: string };
  TxnDate: string;
  DueDate: string;
  DocNumber: string;
  PrivateNote?: string;
  BillEmail?: { Address: string };
  TotalAmt: number;
  CurrencyRef?: { value: string };
}

interface XeroInvoicePayload {
  Type: string;
  Contact: { Name: string; EmailAddress?: string };
  Date: string;
  DueDate: string;
  InvoiceNumber: string;
  LineItems: Array<{
    Description: string;
    Quantity: number;
    UnitAmount: number;
    AccountCode?: string;
    TaxType?: string;
    LineAmount: number;
  }>;
  Status: string;
  CurrencyCode: string;
  Reference?: string;
}

interface FreshBooksInvoicePayload {
  invoice: {
    customerid: number;
    create_date: string;
    due_date: string;
    invoice_number: string;
    currency_code: string;
    lines: Array<{
      name: string;
      description: string;
      qty: number;
      unit_cost: { amount: string };
      amount: { amount: string };
    }>;
    notes?: string;
  };
}

class IntegrationServiceImpl {
  private quickbooksClient: AxiosInstance | null = null;
  private xeroClient: AxiosInstance | null = null;
  private freshbooksClient: AxiosInstance | null = null;

  private getQuickBooksClient(config: IntegrationConfig): AxiosInstance {
    if (!this.quickbooksClient) {
      this.quickbooksClient = axios.create({
        baseURL: `https://quickbooks.api.intuit.com/v3/company/${config.credentials.companyId}`,
        headers: {
          Authorization: `Bearer ${config.credentials.accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
    }
    return this.quickbooksClient;
  }

  private getXeroClient(config: IntegrationConfig): AxiosInstance {
    if (!this.xeroClient) {
      this.xeroClient = axios.create({
        baseURL: 'https://api.xero.com/api.xro/2.0',
        headers: {
          Authorization: `Bearer ${config.credentials.accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'xero-tenant-id': config.credentials.companyId || '',
        },
      });
    }
    return this.xeroClient;
  }

  private getFreshBooksClient(config: IntegrationConfig): AxiosInstance {
    if (!this.freshbooksClient) {
      this.freshbooksClient = axios.create({
        baseURL: `https://api.freshbooks.com/accounting/account/${config.credentials.companyId}`,
        headers: {
          Authorization: `Bearer ${config.credentials.accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
    }
    return this.freshbooksClient;
  }

  async connect(
    provider: IntegrationProvider,
    credentials: IntegrationConfig['credentials']
  ): Promise<boolean> {
    try {
      const testConfig: IntegrationConfig = {
        id: 'test',
        provider,
        isConnected: false,
        credentials,
        autoSync: false,
      };

      const isValid = await this.testConnection(provider, testConfig);
      return isValid;
    } catch (error) {
      console.error(`Failed to connect to ${provider}:`, error);
      return false;
    }
  }

  async disconnect(provider: IntegrationProvider): Promise<boolean> {
    try {
      switch (provider) {
        case IntegrationProvider.QUICKBOOKS:
          this.quickbooksClient = null;
          break;
        case IntegrationProvider.XERO:
          this.xeroClient = null;
          break;
        case IntegrationProvider.FRESHBOOKS:
          this.freshbooksClient = null;
          break;
      }
      return true;
    } catch (error) {
      console.error(`Failed to disconnect from ${provider}:`, error);
      return false;
    }
  }

  async syncInvoice(
    provider: IntegrationProvider,
    invoice: Invoice,
    config: IntegrationConfig
  ): Promise<{ success: boolean; externalId?: string; error?: string }> {
    if (!invoice.extractedData) {
      return {
        success: false,
        error: 'No extracted data available for invoice',
      };
    }

    try {
      switch (provider) {
        case IntegrationProvider.QUICKBOOKS:
          return await this.syncToQuickBooks(invoice, config);
        case IntegrationProvider.XERO:
          return await this.syncToXero(invoice, config);
        case IntegrationProvider.FRESHBOOKS:
          return await this.syncToFreshBooks(invoice, config);
        default:
          return { success: false, error: 'Unsupported provider' };
      }
    } catch (error) {
      console.error(`Failed to sync invoice to ${provider}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async syncToQuickBooks(
    invoice: Invoice,
    config: IntegrationConfig
  ): Promise<{ success: boolean; externalId?: string; error?: string }> {
    const client = this.getQuickBooksClient(config);
    const data = invoice.extractedData as ExtractedData;

    const payload: QuickBooksInvoicePayload = {
      Line: data.items.map((item) => ({
        Amount: item.total,
        DetailType: 'SalesItemLineDetail',
        SalesItemLineDetail: {
          ItemRef: { value: '1', name: item.description },
          Qty: item.quantity,
          UnitPrice: item.unitPrice,
          ...(item.taxRate && {
            TaxCodeRef: { value: 'TAX' },
          }),
        },
        Description: item.description,
      })),
      CustomerRef: { value: '1', name: data.customerName },
      TxnDate: data.invoiceDate.split('T')[0],
      DueDate: data.dueDate.split('T')[0],
      DocNumber: data.invoiceNumber,
      PrivateNote: data.notes,
      ...(data.customerEmail && {
        BillEmail: { Address: data.customerEmail },
      }),
      TotalAmt: data.totalAmount,
      ...(data.currency && {
        CurrencyRef: { value: data.currency },
      }),
    };

    const response = await client.post('/invoice', payload);
    return {
      success: true,
      externalId: response.data.Invoice?.Id,
    };
  }

  private async syncToXero(
    invoice: Invoice,
    config: IntegrationConfig
  ): Promise<{ success: boolean; externalId?: string; error?: string }> {
    const client = this.getXeroClient(config);
    const data = invoice.extractedData as ExtractedData;

    const payload: XeroInvoicePayload = {
      Type: 'ACCREC',
      Contact: {
        Name: data.customerName,
        ...(data.customerEmail && { EmailAddress: data.customerEmail }),
      },
      Date: data.invoiceDate.split('T')[0],
      DueDate: data.dueDate.split('T')[0],
      InvoiceNumber: data.invoiceNumber,
      LineItems: data.items.map((item) => ({
        Description: item.description,
        Quantity: item.quantity,
        UnitAmount: item.unitPrice,
        LineAmount: item.total,
        ...(item.taxRate && { TaxType: 'OUTPUT' }),
      })),
      Status: 'DRAFT',
      CurrencyCode: data.currency || 'USD',
      ...(data.notes && { Reference: data.notes }),
    };

    const response = await client.post('/Invoices', { Invoices: [payload] });
    return {
      success: true,
      externalId: response.data.Invoices?.[0]?.InvoiceID,
    };
  }

  private async syncToFreshBooks(
    invoice: Invoice,
    config: IntegrationConfig
  ): Promise<{ success: boolean; externalId?: string; error?: string }> {
    const client = this.getFreshBooksClient(config);
    const data = invoice.extractedData as ExtractedData;

    const payload: FreshBooksInvoicePayload = {
      invoice: {
        customerid: 1,
        create_date: data.invoiceDate.split('T')[0],
        due_date: data.dueDate.split('T')[0],
        invoice_number: data.invoiceNumber,
        currency_code: data.currency || 'USD',
        lines: data.items.map((item) => ({
          name: item.description,
          description: item.description,
          qty: item.quantity,
          unit_cost: { amount: item.unitPrice.toFixed(2) },
          amount: { amount: item.total.toFixed(2) },
        })),
        ...(data.notes && { notes: data.notes }),
      },
    };

    const response = await client.post('/invoices/invoices', payload);
    return {
      success: true,
      externalId: response.data.response?.result?.invoice?.id?.toString(),
    };
  }

  async testConnection(
    provider: IntegrationProvider,
    config: IntegrationConfig
  ): Promise<boolean> {
    try {
      switch (provider) {
        case IntegrationProvider.QUICKBOOKS: {
          const client = this.getQuickBooksClient(config);
          await client.get('/companyinfo/' + config.credentials.companyId);
          return true;
        }
        case IntegrationProvider.XERO: {
          const client = this.getXeroClient(config);
          await client.get('/Organisation');
          return true;
        }
        case IntegrationProvider.FRESHBOOKS: {
          const client = this.getFreshBooksClient(config);
          await client.get('/users/me');
          return true;
        }
        default:
          return false;
      }
    } catch (error) {
      console.error(`Connection test failed for ${provider}:`, error);
      return false;
    }
  }

  async refreshAccessToken(
    provider: IntegrationProvider,
    config: IntegrationConfig
  ): Promise<{ accessToken?: string; refreshToken?: string; error?: string }> {
    try {
      switch (provider) {
        case IntegrationProvider.QUICKBOOKS: {
          const response = await axios.post(
            'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
            new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: config.credentials.refreshToken || '',
            }),
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${Buffer.from(
                  `${config.credentials.clientId}:${config.credentials.clientSecret}`
                ).toString('base64')}`,
              },
            }
          );
          return {
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
          };
        }
        case IntegrationProvider.XERO: {
          const response = await axios.post(
            'https://identity.xero.com/connect/token',
            new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: config.credentials.refreshToken || '',
            }),
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${Buffer.from(
                  `${config.credentials.clientId}:${config.credentials.clientSecret}`
                ).toString('base64')}`,
              },
            }
          );
          return {
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
          };
        }
        case IntegrationProvider.FRESHBOOKS: {
          const response = await axios.post(
            'https://api.freshbooks.com/auth/oauth/token',
            {
              grant_type: 'refresh_token',
              refresh_token: config.credentials.refreshToken,
              client_id: config.credentials.clientId,
              client_secret: config.credentials.clientSecret,
            }
          );
          return {
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
          };
        }
        default:
          return { error: 'Unsupported provider' };
      }
    } catch (error) {
      console.error(`Failed to refresh token for ${provider}:`, error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const IntegrationService = new IntegrationServiceImpl();