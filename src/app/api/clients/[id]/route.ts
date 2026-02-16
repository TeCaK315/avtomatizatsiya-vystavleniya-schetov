import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/lib/storage';
import {
  GetClientResponse,
  UpdateClientRequest,
  UpdateClientResponse,
  DeleteClientResponse,
  Client,
} from '@/types';

const storage = new StorageService();

export async function GET(_request : NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<GetClientResponse>> {
  try {
    const clientId = params.id;

    if (!clientId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Client ID is required',
        },
        { status: 400 }
      );
    }

    const client = storage.getClient(clientId);

    if (!client) {
      return NextResponse.json(
        {
          success: false,
          error: 'Client not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      client,
    });
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch client',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<UpdateClientResponse>> {
  try {
    const clientId = params.id;

    if (!clientId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Client ID is required',
        },
        { status: 400 }
      );
    }

    const existingClient = storage.getClient(clientId);

    if (!existingClient) {
      return NextResponse.json(
        {
          success: false,
          error: 'Client not found',
        },
        { status: 404 }
      );
    }

    const body: UpdateClientRequest = await request.json();

    // Validate email format if provided
    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email format',
        },
        { status: 400 }
      );
    }

    // Check if email is already taken by another client
    if (body.email && body.email !== existingClient.email) {
      const allClients = storage.getClients();
      const emailExists = allClients.some(
        (c) => c.email === body.email && c.id !== clientId
      );

      if (emailExists) {
        return NextResponse.json(
          {
            success: false,
            error: 'Email already exists for another client',
          },
          { status: 409 }
        );
      }
    }

    const updatedClient: Client = {
      ...existingClient,
      ...(body.name !== undefined && { name: body.name }),
      ...(body.email !== undefined && { email: body.email }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.address !== undefined && { address: body.address }),
      ...(body.taxId !== undefined && { taxId: body.taxId }),
      updatedAt: new Date().toISOString(),
    };

    storage.updateClient(clientId, updatedClient);

    return NextResponse.json({
      success: true,
      client: updatedClient,
    });
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update client',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request : NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<DeleteClientResponse>> {
  try {
    const clientId = params.id;

    if (!clientId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Client ID is required',
        },
        { status: 400 }
      );
    }

    const existingClient = storage.getClient(clientId);

    if (!existingClient) {
      return NextResponse.json(
        {
          success: false,
          error: 'Client not found',
        },
        { status: 404 }
      );
    }

    // Check if client has associated invoices
    const allInvoices = storage.getInvoices();
    const hasInvoices = allInvoices.some((invoice) => invoice.clientId === clientId);

    if (hasInvoices) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete client with existing invoices. Please delete or reassign invoices first.',
        },
        { status: 409 }
      );
    }

    storage.deleteClient(clientId);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete client',
      },
      { status: 500 }
    );
  }
}