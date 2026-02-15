import { NextRequest, NextResponse } from 'next/server';
import {
  IntegrationListResponse,
  CreateIntegrationRequest,
  CreateIntegrationResponse,
  IntegrationProvider,
  IntegrationConfig
} from '@/types';
import { StorageService } from '@/lib/storage';
import { IntegrationService } from '@/lib/integrations';

export async function GET(_request : NextRequest) {
  try {
    const storageService = StorageService;
    const integrations = storageService.getAllIntegrations();

    return NextResponse.json(
      {
        success: true,
        integrations
      } as IntegrationListResponse,
      { status: 200 }
    );

  } catch (error) {
    console.error('Error fetching integrations:', error);
    return NextResponse.json(
      {
        success: false,
        integrations: []
      } as IntegrationListResponse,
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateIntegrationRequest = await request.json();
    const { provider, credentials, autoSync } = body;

    // Validate request
    if (!provider || !credentials) {
      return NextResponse.json(
        {
          success: false,
          message: 'Provider and credentials are required'
        } as CreateIntegrationResponse,
        { status: 400 }
      );
    }

    // Validate provider
    const validProviders = Object.values(IntegrationProvider);
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid provider. Must be one of: ${validProviders.join(', ')}`
        } as CreateIntegrationResponse,
        { status: 400 }
      );
    }

    // Check if integration already exists
    const storageService = StorageService;
    const existingIntegration = storageService.getIntegration(provider);
    
    if (existingIntegration) {
      return NextResponse.json(
        {
          success: false,
          message: `Integration with ${provider} already exists. Use PUT to update.`
        } as CreateIntegrationResponse,
        { status: 409 }
      );
    }

    // Test connection with provided credentials
    const integrationService = IntegrationService;
    const connectionSuccess = await integrationService.connect(provider, credentials);

    if (!connectionSuccess) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to connect to integration provider. Please check your credentials.'
        } as CreateIntegrationResponse,
        { status: 400 }
      );
    }

    // Create new integration config
    const newIntegration: IntegrationConfig = {
      id: `${provider}-${Date.now()}`,
      provider,
      isConnected: true,
      credentials,
      autoSync: autoSync ?? false,
      lastSyncAt: undefined
    };

    // Save to storage
    storageService.saveIntegration(newIntegration);

    return NextResponse.json(
      {
        success: true,
        integration: newIntegration,
        message: `Successfully connected to ${provider}`
      } as CreateIntegrationResponse,
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating integration:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      } as CreateIntegrationResponse,
      { status: 500 }
    );
  }
}