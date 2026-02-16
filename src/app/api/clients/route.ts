import { NextRequest, NextResponse } from 'next/server';
import {
  CreateClientRequest,
  CreateClientResponse,
  GetClientsResponse,
  Client,
} from '@/types';
import { StorageService } from '@/lib/storage';

export async function GET(_request : NextRequest
): Promise<NextResponse<GetClientsResponse>> {
  try {
    const storage = new StorageService();
    const clients = storage.getClients();

    // Sort clients by name
    const sortedClients = clients.sort((a, b) => 
      a.name.localeCompare(b.name)
    );

    return NextResponse.json(
      {
        success: true,
        clients: sortedClients,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      {
        success: false,
        clients: [],
        error: error instanceof Error ? error.message : 'Failed to fetch clients',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<CreateClientResponse>> {
  try {
    const body: CreateClientRequest = await request.json();

    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name and email are required',
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email format',
        },
        { status: 400 }
      );
    }

    const storage = new StorageService();
    
    // Check if client with same email already exists
    const existingClients = storage.getClients();
    const duplicateClient = existingClients.find(
      (c) => c.email.toLowerCase() === body.email.toLowerCase()
    );

    if (duplicateClient) {
      return NextResponse.json(
        {
          success: false,
          error: 'Client with this email already exists',
        },
        { status: 409 }
      );
    }

    // Create new client
    const now = new Date().toISOString();
    const newClient: Client = {
      id: `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone?.trim() || undefined,
      address: body.address?.trim() || undefined,
      taxId: body.taxId?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    // Save client to storage
    storage.saveClient(newClient);

    return NextResponse.json(
      {
        success: true,
        client: newClient,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create client',
      },
      { status: 500 }
    );
  }
}