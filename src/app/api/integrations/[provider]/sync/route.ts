import { NextRequest, NextResponse } from 'next/server';
import {
  IntegrationProvider,
  SyncInvoiceRequest,
  SyncInvoiceResponse,
  InvoiceStatus
} from '@/types';
import { StorageService } from '@/lib/storage';
import { IntegrationService } from '@/lib/integrations';

const storage = new StorageService();
const integrationService = new IntegrationService();

export async function POST(
  request: NextRequest,
  { params }: { params: { provider: string } }
): Promise<NextResponse<SyncInvoiceResponse>> {
  try {
    const provider = params.provider as IntegrationProvider;

    if (!Object.values(IntegrationProvider).includes(provider)) {
      return NextResponse.json(
        {
          success: false,
          provider: provider as IntegrationProvider,
          syncedAt: new Date().toISOString(),
          message: 'Invalid integration provider'
        },
        { status: 400 }
      );
    }

    const body: SyncInvoiceRequest = await request.json();

    if (!body.invoiceId) {
      return NextResponse.json(
        {
          success: false,
          provider,
          syncedAt: new Date().toISOString(),
          message: 'Invoice ID is required'
        },
        { status: 400 }
      );
    }

    const invoice = storage.getInvoice(body.invoiceId);

    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          provider,
          syncedAt: new Date().toISOString(),
          message: 'Invoice not found'
        },
        { status: 404 }
      );
    }

    if (invoice.status !== InvoiceStatus.EXTRACTED && invoice.status !== InvoiceStatus.VERIFIED) {
      return NextResponse.json(
        {
          success: false,
          provider,
          syncedAt: new Date().toISOString(),
          message: 'Invoice must be extracted or verified before syncing'
        },
        { status: 400 }
      );
    }

    if (!invoice.extractedData) {
      return NextResponse.json(
        {
          success: false,
          provider,
          syncedAt: new Date().toISOString(),
          message: 'Invoice has no extracted data'
        },
        { status: 400 }
      );
    }

    const integration = storage.getIntegration(provider);

    if (!integration) {
      return NextResponse.json(
        {
          success: false,
          provider,
          syncedAt: new Date().toISOString(),
          message: 'Integration not configured'
        },
        { status: 404 }
      );
    }

    if (!integration.isConnected) {
      return NextResponse.json(
        {
          success: false,
          provider,
          syncedAt: new Date().toISOString(),
          message: 'Integration is not connected'
        },
        { status: 400 }
      );
    }

    const syncResult = await integrationService.syncInvoice(provider, invoice);

    if (!syncResult.success) {
      return NextResponse.json(
        {
          success: false,
          provider,
          syncedAt: new Date().toISOString(),
          message: 'Failed to sync invoice to accounting system'
        },
        { status: 500 }
      );
    }

    const syncedAt = new Date().toISOString();

    const updatedSyncedIntegrations = invoice.syncedToIntegrations.includes(provider)
      ? invoice.syncedToIntegrations
      : [...invoice.syncedToIntegrations, provider];

    storage.updateInvoice(body.invoiceId, {
      syncedToIntegrations: updatedSyncedIntegrations
    });

    storage.updateIntegration(provider, {
      lastSyncAt: syncedAt
    });

    return NextResponse.json(
      {
        success: true,
        provider,
        externalId: syncResult.externalId,
        syncedAt,
        message: `Invoice synced successfully to ${provider}`
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error syncing invoice:', error);
    const provider = params.provider as IntegrationProvider;
    return NextResponse.json(
      {
        success: false,
        provider,
        syncedAt: new Date().toISOString(),
        message: error instanceof Error ? error.message : 'Failed to sync invoice'
      },
      { status: 500 }
    );
  }
}