import { notifications } from '@mantine/notifications';
import { fetchBaseQuery, type BaseQueryApi, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { authSlice } from './features/auth/authSlice';
import {
    MOCK_BRANCHES,
    MOCK_BRANCHES_PAGE,
    MOCK_TENANTS,
    MOCK_TENANTS_PAGE,
} from './mockData';

export interface ErrorResponse {
    message: string;
    error: string;
    status: number;
    timestamp: string;
    errors?: string[];
}

const rawBaseQuery = fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL,
    prepareHeaders: (headers, api) => {
      const token = (api.getState() as { auth: { accessToken: string } }).auth.accessToken;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
});

// ---------------------------------------------------------------------------
// Mock interceptor — active when VITE_USE_MOCK=true in your .env file
// ---------------------------------------------------------------------------
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// In-memory "database" so create/update/delete/patch work during the session
let mockBranches = [...MOCK_BRANCHES];

function mockDelay<T>(data: T): Promise<{ data: T }> {
    return new Promise((resolve) => setTimeout(() => resolve({ data }), 300));
}

async function mockBaseQuery(args: string | FetchArgs): Promise<{ data: unknown } | { error: FetchBaseQueryError }> {
    const url = typeof args === 'string' ? args : args.url;
    const method = typeof args === 'string' ? 'GET' : (args.method ?? 'GET');
    const body = typeof args === 'object' ? args.body : undefined;

    // --- Tenants ---
    if (url.startsWith('/tenants')) {
        const idMatch = url.match(/^\/tenants\/([^/?]+)/)
        if (idMatch) {
            const tenant = MOCK_TENANTS.find((t) => t.tenantId === idMatch[1])
            return tenant ? mockDelay(tenant) : { error: { status: 404, data: { message: 'Tenant not found' } } as FetchBaseQueryError }
        }
        return mockDelay(MOCK_TENANTS_PAGE)
    }

    // --- Branches ---
    if (url.startsWith('/branches')) {
        const statusMatch = url.match(/^\/branches\/([^/?]+)\/status$/)
        const idMatch = url.match(/^\/branches\/([^/?]+)$/)

        // PATCH /branches/:id/status
        if (statusMatch && method === 'PATCH') {
            const idx = mockBranches.findIndex((b) => b.branchId === statusMatch[1])
            if (idx !== -1 && body) {
                mockBranches[idx] = { ...mockBranches[idx], status: (body as { status: string }).status as 'ACTIVE' | 'INACTIVE' }
                return mockDelay(mockBranches[idx])
            }
            return { error: { status: 404, data: { message: 'Branch not found' } } as FetchBaseQueryError }
        }

        // GET /branches/:id
        if (idMatch && method === 'GET') {
            const branch = mockBranches.find((b) => b.branchId === idMatch[1])
            return branch ? mockDelay(branch) : { error: { status: 404, data: { message: 'Branch not found' } } as FetchBaseQueryError }
        }

        // PUT /branches/:id
        if (idMatch && method === 'PUT') {
            const idx = mockBranches.findIndex((b) => b.branchId === idMatch[1])
            if (idx !== -1 && body) {
                mockBranches[idx] = { ...mockBranches[idx], ...(body as object) }
                return mockDelay(mockBranches[idx])
            }
            return { error: { status: 404, data: { message: 'Branch not found' } } as FetchBaseQueryError }
        }

        // DELETE /branches/:id
        if (idMatch && method === 'DELETE') {
            mockBranches = mockBranches.filter((b) => b.branchId !== idMatch[1])
            return mockDelay(undefined)
        }

        // POST /branches
        if (method === 'POST' && body) {
            const newBranch = {
                ...(body as object),
                branchId: `branch-${Date.now()}`,
                tenantName: MOCK_TENANTS.find((t) => t.tenantId === (body as { tenantId: string }).tenantId)?.tenantName ?? null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: 'ACTIVE' as const,
            }
            mockBranches.push(newBranch as typeof MOCK_BRANCHES[number])
            return mockDelay(newBranch)
        }

        // GET /branches (list with basic filtering)
        const page = { ...MOCK_BRANCHES_PAGE, content: mockBranches, totalElements: mockBranches.length }
        return mockDelay(page)
    }

    return { error: { status: 404, data: { message: 'Mock: endpoint not found' } } as FetchBaseQueryError }
}

export const coreBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api: BaseQueryApi, extraOptions: object) => {
    if (USE_MOCK) {
        return mockBaseQuery(args) as ReturnType<typeof coreBaseQuery>
    }

    const result = await rawBaseQuery(args, api, extraOptions);

    if (result.error) {
        const { data } = result.error as { data: ErrorResponse };
        if (data.message) {
            const message = data.message
            notifications.show({
                color: 'red',
                title: 'Error',
                message,
                autoClose: 5000,
            });
        }
    }
    return result;
}