import { NextRequest, NextResponse } from 'next/server';
import {
  IntegrationProvider,
  UpdateIntegrationRequest,
  UpdateIntegrationResponse,
  IntegrationConfig
} from '@/types';
import { StorageService } from '@/lib/storage';

const storage = new StorageService();

export async function PUT(
  request: NextRequest,
  { params }: { params: { provider: string } }
): Promise<NextResponse<UpdateIntegrationResponse>> {
  try {
    const provider = params.provider as IntegrationProvider;

    if (!Object.values(IntegrationProvider).includes(provider)) {
      return NextResponse.json(
        {
          success: false,
          integration: {} as IntegrationConfig,
          message: 'Invalid integration provider'
        },
        { status: 400 }
      );
    }

    const body: UpdateIntegrationRequest = await request.json();

    const existingIntegration = storage.getIntegration(provider);

    if (!existingIntegration) {
      return NextResponse.json(
        {
          success: false,
          integration: {} as IntegrationConfig,
          message: 'Integration not found'
        },
        { status: 404 }
      );
    }

    const updates: Partial<IntegrationConfig> = {};

    if (body.credentials !== undefined) {
      updates.credentials = {
        ...existingIntegration.credentials,
        ...body.credentials
      };
    }

    if (body.autoSync !== undefined) {
      updates.autoSync = body.autoSync;
    }

    storage.updateIntegration(provider, updates);

    const updatedIntegration = storage.getIntegration(provider);

    if (!updatedIntegration) {
      return NextResponse.json(
        {
          success: false,
          integration: {} as IntegrationConfig,
          message: 'Failed to update integration'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        integration: updatedIntegration,
        message: 'Integration updated successfully'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating integration:', error);
    return NextResponse.json(
      {
        success: false,
        integration: {} as IntegrationConfig,
        message: error instanceof Error ? error.message : 'Failed to update integration'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request : NextRequest,
  { params }: { params: { provider: string } }
): Promise<NextResponse<{ success: boolean; message?: string }>> {
  try {
    const provider = params.provider as IntegrationProvider;

    if (!Object.values(IntegrationProvider).includes(provider)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid integration provider'
        },
        { status: 400 }
      );
    }

    const existingIntegration = storage.getIntegration(provider);

    if (!existingIntegration) {
      return NextResponse.json(
        {
          success: false,
          message: 'Integration not found'
        },
        { status: 404 }
      );
    }

    storage.deleteIntegration(provider);

    return NextResponse.json(
      {
        success: true,
        message: 'Integration deleted successfully'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting integration:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete integration'
      },
      { status: 500 }
    );
  }
}