import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jest,describe,beforeEach,it, expect } from '@jest/globals';
import { AuthRequest } from '../src/types';
import { authenticate } from '../src/middleware/auth';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockImplementation(function (this: Response) { return this; }) as unknown as (code: number) => Response,
      json: jest.fn().mockImplementation(function (this: Response, body: any) { return this; }) as unknown as (body: any) => Response,
    };
    mockNext = jest.fn();
    
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should return 401 when no authorization header is provided', async () => {
    await authenticate(
      mockRequest as AuthRequest,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Access token is required',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when authorization header is empty', async () => {
    mockRequest.headers = {
      authorization: '',
    };

    await authenticate(
      mockRequest as AuthRequest,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Access token is required',
    });
  });

  it('should return 401 when token is invalid', async () => {
    mockRequest.headers = {
      authorization: 'Bearer invalid-token',
    };

    mockJwt.verify.mockImplementation(() => {
      throw new jwt.JsonWebTokenError('Invalid token');
    });

    await authenticate(
      mockRequest as AuthRequest,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid or expired token',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when user is not found', async () => {
    mockRequest.headers = {
      authorization: 'Bearer valid-token',
    };

    mockJwt.verify.mockReturnValue({
      userId: 'user-id',
      email: 'test@example.com',
      role: 'EMPLOYEE',
    } as any);

    const { prisma } = require('../../src/lib/prisma');
    prisma.user.findUnique.mockResolvedValue(null);

    await authenticate(
      mockRequest as AuthRequest,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'User not found or token is invalid',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next when authentication is successful', async () => {
    mockRequest.headers = {
      authorization: 'Bearer valid-token',
    };

    const mockUser = {
      id: 'user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'EMPLOYEE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockJwt.verify.mockReturnValue({
      userId: 'user-id',
      email: 'test@example.com',
      role: 'EMPLOYEE',
    } as any);

    const { prisma } = require('../../src/lib/prisma');
    prisma.user.findUnique.mockResolvedValue(mockUser);

    await authenticate(
      mockRequest as AuthRequest,
      mockResponse as Response,
      mockNext
    );

    expect(mockRequest.user).toEqual(mockUser);
    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();
  });

  it('should handle Bearer token format correctly', async () => {
    mockRequest.headers = {
      authorization: 'Bearer valid-token',
    };

    mockJwt.verify.mockReturnValue({
      userId: 'user-id',
      email: 'test@example.com',
      role: 'EMPLOYEE',
    } as any);

    const mockUser = {
      id: 'user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'EMPLOYEE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const { prisma } = require('../../src/lib/prisma');
    prisma.user.findUnique.mockResolvedValue(mockUser);

    await authenticate(
      mockRequest as AuthRequest,
      mockResponse as Response,
      mockNext
    );

    expect(mockJwt.verify).toHaveBeenCalledWith('valid-token', expect.any(String));
  });
});