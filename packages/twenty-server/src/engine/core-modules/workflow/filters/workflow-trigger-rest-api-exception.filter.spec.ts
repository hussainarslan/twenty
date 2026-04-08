import { type ArgumentsHost } from '@nestjs/common';

jest.mock(
  'twenty-shared/utils',
  () => {
    class CustomError extends Error {}

    return {
      CustomError,
      assertUnreachable: jest.fn((value: never) => {
        throw new Error(`Unexpected value: ${String(value)}`);
      }),
    };
  },
  { virtual: true },
);
jest.mock(
  'src/engine/core-modules/exception-handler/http-exception-handler.service',
  () => {
    class HttpExceptionHandlerService {
      handleError = jest.fn();
    }

    return { HttpExceptionHandlerService };
  },
);

import { HttpExceptionHandlerService } from 'src/engine/core-modules/exception-handler/http-exception-handler.service';
import {
  TwentyORMException,
  TwentyORMExceptionCode,
} from 'src/engine/twenty-orm/exceptions/twenty-orm.exception';
import {
  WorkflowTriggerException,
  WorkflowTriggerExceptionCode,
} from 'src/modules/workflow/workflow-trigger/exceptions/workflow-trigger.exception';

import { WorkflowTriggerRestApiExceptionFilter } from './workflow-trigger-rest-api-exception.filter';

const createMockArgumentsHost = (
  response: Record<string, never>,
): ArgumentsHost =>
  ({
    switchToHttp: () => ({
      getResponse: () => response,
    }),
  }) as ArgumentsHost;

describe('WorkflowTriggerRestApiExceptionFilter', () => {
  let filter: WorkflowTriggerRestApiExceptionFilter;
  let mockResponse: Record<string, never>;
  let mockHost: ArgumentsHost;
  let handleErrorMock: jest.Mock;
  let handleErrorResult: { ok: true };

  beforeEach(() => {
    mockResponse = {};
    mockHost = createMockArgumentsHost(mockResponse);
    handleErrorResult = { ok: true };
    handleErrorMock = jest.fn().mockReturnValue(handleErrorResult);

    filter = new WorkflowTriggerRestApiExceptionFilter({
      handleError: handleErrorMock,
    } as unknown as HttpExceptionHandlerService);
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('catch', () => {
    it('should map WORKSPACE_NOT_FOUND twenty orm errors to 404', () => {
      const exception = new TwentyORMException(
        'Workspace not found',
        TwentyORMExceptionCode.WORKSPACE_NOT_FOUND,
      );

      const result = filter.catch(exception, mockHost);

      expect(result).toBe(handleErrorResult);
      expect(handleErrorMock).toHaveBeenCalledTimes(1);
      expect(handleErrorMock).toHaveBeenCalledWith(
        exception,
        mockResponse,
        404,
      );
    });

    it('should map WORKSPACE_SCHEMA_NOT_FOUND twenty orm errors to 404', () => {
      const exception = new TwentyORMException(
        'Workspace schema not found',
        TwentyORMExceptionCode.WORKSPACE_SCHEMA_NOT_FOUND,
      );

      const result = filter.catch(exception, mockHost);

      expect(result).toBe(handleErrorResult);
      expect(handleErrorMock).toHaveBeenCalledTimes(1);
      expect(handleErrorMock).toHaveBeenCalledWith(
        exception,
        mockResponse,
        404,
      );
    });

    it('should keep workflow NOT_FOUND errors mapped to 404', () => {
      const exception = new WorkflowTriggerException(
        'Workflow not found',
        WorkflowTriggerExceptionCode.NOT_FOUND,
      );

      const result = filter.catch(exception, mockHost);

      expect(result).toBe(handleErrorResult);
      expect(handleErrorMock).toHaveBeenCalledTimes(1);
      expect(handleErrorMock).toHaveBeenCalledWith(
        exception,
        mockResponse,
        404,
      );
    });

    it('should keep workflow validation errors mapped to 400', () => {
      const exception = new WorkflowTriggerException(
        'Invalid workflow status',
        WorkflowTriggerExceptionCode.INVALID_WORKFLOW_STATUS,
      );

      const result = filter.catch(exception, mockHost);

      expect(result).toBe(handleErrorResult);
      expect(handleErrorMock).toHaveBeenCalledTimes(1);
      expect(handleErrorMock).toHaveBeenCalledWith(
        exception,
        mockResponse,
        400,
      );
    });

    it('should keep workflow internal errors mapped to 500', () => {
      const exception = new WorkflowTriggerException(
        'Internal workflow error',
        WorkflowTriggerExceptionCode.INTERNAL_ERROR,
      );

      const result = filter.catch(exception, mockHost);

      expect(result).toBe(handleErrorResult);
      expect(handleErrorMock).toHaveBeenCalledTimes(1);
      expect(handleErrorMock).toHaveBeenCalledWith(
        exception,
        mockResponse,
        500,
      );
    });
  });
});
